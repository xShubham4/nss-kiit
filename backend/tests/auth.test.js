const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Unit = require("../src/models/Unit");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nss-kiit-test");
  await User.deleteMany({});
  await Unit.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("Auth API", () => {
  let unitId;
  let adminToken;

  it("should seed a unit", async () => {
    const unit = await Unit.create({ name: "Test School", slug: "test-school" });
    unitId = unit._id.toString();
    expect(unit.name).toBe("Test School");
  });

  it("should create a superadmin directly", async () => {
    await User.create({
      name: "Super Admin",
      email: "super@nsskiit.in",
      password: "SuperPass1",
      role: "superadmin",
    });
  });

  it("should login as superadmin", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "super@nsskiit.in",
      password: "SuperPass1",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    adminToken = res.body.accessToken;
  });

  it("should create an admin (superadmin only)", async () => {
    const res = await request(app)
      .post("/api/auth/admin")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Unit Admin",
        email: "admin@nsskiit.in",
        password: "AdminPass1",
        unitId,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.admin.email).toBe("admin@nsskiit.in");
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@nsskiit.in",
      password: "WrongPassword1",
    });
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 for protected route without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });
});