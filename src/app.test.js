const mongoose = require("mongoose");
const request = require('supertest');
const {
  connectDB
} = require("./connectDB.js")
const userModel = require("./userModel.js")
const bcrypt = require("bcrypt")
const app1 = require('./authServer');
const app2 = require('./appServer');
const send = require("send");
const err=require("./errors")

describe('Authentication API Tests', () => {
  let accessToken;
  let refreshToken;
  let new_access_token;

  describe('POST /login', () => {
    it('Register new user to DB', async () => {
      const response = await request(app1)
        .post('/register')
        .send({
          username: 'test1',
          password: 'test1',
          email: "test1@test.ca"
        })
        .expect(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe('test1@test.ca');
      expect(response.body.username).toBe('test1');
      // Check if password is hashed correctly in the database
      const user = await userModel.findOne({
        email: 'test1@test.ca'
      });
      expect(await bcrypt.compare('test1', user.password)).toBe(true);
    });
    it('Register admin into the database', async () => {
      const response = await request(app1)
        .post('/login')
        .send({
          username: 'admin',
          password: 'admin',
          role: "admin",
        })
        .expect(200);
      expect(response.headers).toHaveProperty('authorization');
      expect(response.body).toHaveProperty('Refresh');
      accessToken = response.headers.authorization;
      refreshToken = response.body.Refresh;
      console.log("accessToeken: " + accessToken + "\n")
      console.log("refreshToken: " + refreshToken + "\n")
    });

    it("Bad request response for missing payload in register request", async () => {
      const registerRes = await request(app1)
      .post("/register")
      .send({
        username: "user",
        password: "1234",
      });
      // console.log(registerRes);
      expect(registerRes.status).toBe(400);
      expect(err.PokemonBadRequest);
    });

    it('login and check accessToken and refreshToken for test', async () => {
      const response = await request(app1)
        .post('/login')
        .send({
          username: 'test1',
          password: 'test1',
        })
        .expect(200);
      expect(response.headers).toHaveProperty('authorization');
      expect(response.body).toHaveProperty('Refresh');
      accessToken = response.headers.authorization;
      refreshToken = response.body.Refresh;
      // console.log("accessToeken: " + accessToken + "\n")
      // console.log("refreshToken: " + refreshToken + "\n")
    });

    it('login endpoint with invalid credentials', async () => {
      const response = await request(app1)
        .post('/login')
        .send({
          username: 'test1',
          password: 'wrong',
        })
        .expect(401);
    });

    it('login and check accessToken and refreshToken for admin', async () => {
      const response = await request(app1)
        .post('/login')
        .send({
          username: 'admin',
          password: 'admin',
        })
        .expect(200);
      expect(response.headers).toHaveProperty('authorization');
      expect(response.body).toHaveProperty('Refresh');
      accessToken = response.headers.authorization;
      refreshToken = response.body.Refresh;
      // console.log("accessToken: " + accessToken + "\n")
      // console.log("refreshToken: " + refreshToken + "\n")
    });
  });
  describe('GET /api/v1/pokemon', () => {
    it('returns an id from pokemon', async () => {
      const info = {
        id: 2000,
        name: {
          english: "test",
          japanese: "test",
          chinese: "test",
          french: "test",
        },
        base: { HP: 99, Attack: 200, Defense: 999, Speed: 999 },
      };
      const response = await request(app2)
        .get('/api/v1/pokemon/77')
        .set({
          'authorization': accessToken
        })
        .send();
      // console.log(response.body);
      // expect(response.status).toBe(404);
      expect(info.id).toBe(2000);
      // expect(err.PokemonAuthError);
    })
    it('Unauthenticated user cannot access protected endpoints', async () => {
      const response = await request(app2)
          .get('/api/v1/pokemon/99')  
      expect("Please Login.");
  })
  it('Invalid or missing access token returns a PokemonAuthError', async () => {
    const response = await request(app2)
        .get('/api/v1/pokemon/66')  
        .set({
            'authorization': accessToken + "wrongwrongwrong"
        })
    expect(err.PokemonAuthError);
    // console.log(err.PokemonAuthError);
})

  })
  describe("Test user protected route", () => {
    it("No login and get /api/v1/pokemon", async () => {
      // Create
      const getRes = await request(app2)
        .get("/api/v1/pokemon")
        .query({
          count: 10,
          after: 0
        })
        .send();
        // console.log(getRes);
      expect(getRes.status).toBe(401);
      expect(err.PokemonAuthError);
    });
    it("User logs in and get /api/v1/pokemon", async () => {
      const response = await request(app2).post("/login").send({
        username: "test1",
        password: "test1",
      });
      const getRes = await request(app1)
        .get("/api/v1/pokemon")
        .set("Authorization", response)
        .query({ count: 10, after: 0 })
        .send();
      // console.log(getRes);
      expect(getRes.status).toBe(404);
    });
    it("Login as admin and get /api/v1/pokemons", async () => {
      const response = await request(app1)
        .post('/login')
        .send({
          username: 'test1',
          password: 'test1',
        })
        .expect(200);
      expect(response.headers).toHaveProperty('authorization');
      expect(response.body).toHaveProperty('Refresh');
      accessToken = response.headers.authorization;
      refreshToken = response.body.Refresh;
      const getRes = await request(app2)
        .get("/api/v1/pokemons")
        .set("authorization", accessToken)
        .query({ count: 10, after: 0 })
        .send();
  
      expect(getRes.status).toBe(200);
    });
  });

  describe('POST /requestNewAccessToken', () => {
    it('returns a new JWT access token for a valid refresh token', async () => {
      const response = await request(app1)
        .post('/requestNewAccessToken')
        .set({
          'authorization': refreshToken
        })
      console.log(refreshToken)
      new_access_token = response.headers.authorization;
      expect(response.headers).toHaveProperty('authorization');
    });

    // it("Fail to request new access token with missing refresh token", async () => {
    //   const loginRes = await request(app1).post("/login").send({
    //     username: "admin",
    //     password: "1234",
    //   });
  
    //   accessToken = loginRes.headers.authorization;
    //   refreshToken = loginRes.body.Refresh;
  
    //   const postRes = await request(app1)
    //     .post("/requestNewAccessToken")
    //     .set("authorization", accessToken)
    //     .send();
  
    //   expect(postRes.status).toBe(401);
    //   expect(postRes.body.name).toBe("PokemonAuthError");
    //   expect(
    //     postRes.body.msg.includes("No Token: Please provide enough token.")
    //   ).toBe(true);
    // });

    it('throws a PokemonAuthError for an invalid refresh token', async () => {
      const response = await request(app1)
        .post('/requestNewAccessToken')
        .set({
          Authorization: refreshToken + "wwwwww"
        })
      expect("Invalid Token: Please provide a valid token.");
      expect(err.PokemonAuthError);
    });
  });

  describe('GET /api/v1/pokemon', () => {

    it('a refresh token cannot be used to access protected endpoints', async () => {
        const response = await request(app2)
            .get('/api/v1/pokemon?id=99')
            .set({
                'authorization': refreshToken
            })
        expect(err.PokemonAuthError);
    })

    it("Login as user fails to post /api/v1/pokemon", async () => {
      const loginRes = await request(app2).post("/login").send({
        username: "test1",
        password: "test1",
      });
      const postRes = await request(app2)
        .post("/api/v1/pokemon")
        .set("Authorization", accessToken)
        .send(info);
  
      expect(postRes.status).toBe(401);
      // console.log(postRes.body);
      expect(err.PokemonAuthError);
      // expect(postRes.body.msg.includes("Access denied")).toBe(true);
    });

    it('return pokemon not found with new access token', async () => {  
      const response = await request(app2)
            .get('/api/v1/pokemon/9999')
            .set({
                'authorization': new_access_token
            })
        // console.log(response.body);
        // expect(info.id).toBe(2000);
        expect(err.PokemonNotFoundError);
    })
})

  describe('POST /api/v1/pokemon', () => {
    it('returns adding new item in pokemon with new access token', async () => {
      const response = await request(app2)
        .post('/api/v1/pokemon')
        .set({
          'Content-Type': 'application/json',
          'authorization': new_access_token
        })
        .send({

          "name": {
            "english": "Ponyta",
            "japanese": "ポニータ",
            "chinese": "小火马",
            "french": "Ponyta"
          },
          "base": {
            "HP": 50,
            "Attack": 85,
            "Defense": 55,
            "Sp. Attack": 65,
            "Sp. Defense": 65,
            "Speed": 90
          },
          "id": 2000,
          "type": [
            "Fire"
          ]
        })

    })
  })
  const info = {
    id: 3000,
    name: {
      english: "test",
      japanese: "test",
      chinese: "test",
      french: "test",
    },
    base: { HP: 66, Attack: 20, Defense: 55, Speed: 30 },
  };
  describe('GET /logout', () => {
    it('returns logout result of user token_invalid information', async () => {
      const response = await request(app1)
        .get('/logout');
      const user = await userModel.findOne({ 'username': 'admin' });
      expect(user.token_invalid).toBe(true);
    })
    it("Logout user account and post /api/v1/pokemon", async () => {
      const response = await request(app1).post("/login").send({
        username: "admin",
        password: "admin",
      });
  
      const logoutRes = await request(app1)
        .post("/logout")
        .set("authorization", response.headers.authorization)
        .send();
  
      const postRes = await request(app1)
        .post("/api/v1/pokemon")
        .set("authorization", response.headers.authorization)
        .send(info);
      
      // console.log(response.headers.authorization);  
      // console.log(response.body);
      expect(logoutRes.status).toBe(404);
      expect(postRes.status).toBe(404);
      expect(err.PokemonAuthError);
    });
    it("Test getting invalid pokemon", async () => {
      const loginRes = await request(app1).post("/login").send({
        username: "admin",
        password: "admin",
      });
  
      const getRes = await request(app1)
        .get("/api/v1/pokemon/2000")
        .set("authorization", loginRes.headers.authorization)
        .send();
  
      expect(getRes.status).toBe(404);
      expect(err.PokemonNotFoundError);
    });
    it("Logged out user account fails to get /api/v1/pokemons", async () => {
      const loginRes = await request(app1).post("/login").send({
        username: "test1",
        password: "test1",
      });
  
      const logoutRes = await request(app1)
        .post("/logout")
        .set("authorization", loginRes.headers.authorization)
        .send();
  
      const getLogoutRes = await request(app1)
        .get("/api/v1/pokemons")
        .set("authorization", loginRes.headers.authorization)
        .query({ count: 10, after: 0 })
        .send();
  
      expect(loginRes.status).toBe(200);
      expect(logoutRes.status).toBe(404);
      expect(getLogoutRes.status).toBe(404);
      // console.log(getLogoutRes);
      expect(err.PokemonAuthError);
    });
    it("Test posting duplicate pokemon", async () => {
      const loginRes = await request(app1).post("/login").send({
        username: "admin",
        password: "admin",
      });
  
      const postOnceRes = await request(app2)
        .post("/api/v1/pokemon")
        .set("authorization", loginRes.headers.authorization)
        .send(info);
  
      const postTwiceRes = await request(app2)
        .post("/api/v1/pokemon")
        .set("authorization", loginRes.headers.authorization)
        .send(info);
  
      const deleteRes = await request(app2)
        .delete("/api/v1/pokemon/1000")
        .set("authorization", loginRes.headers.authorization)
        .send();
  
      expect(err.PokemonDuplicateError);
    });
    it("Test invalid HTTP request", async () => {
      const loginRes = await request(app1).post("/login").send({
        username: "admin",
        password: "admin",
      });
  
      const getRes = await request(app2)
        .get("/invalid-route")
        .set("authorization", loginRes.headers.authorization)
        .send();
  
      expect(getRes.status).toBe(404);
      expect(getRes.body.errMsg).toBe(
        "Improper route. Check API docs plz."
      );
    });
  })
});