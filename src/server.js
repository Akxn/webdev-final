const mongoose = require("mongoose")
const express = require("express")
const { connectDB } = require("./connectDB.js")
const { getTypes } = require("./getTypes.js")
const { handleErr } = require("./errorHandler.js")
const morgan = require("morgan")
const cors = require("cors")
const { asyncWrapper } = require("./asyncWrapper.js")
require("dotenv").config();
const userModel = require("./userModel.js")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
// const { getChart } = require("./getChart.js")

const {
  PokemonBadRequest,
  PokemonBadRequestMissingID,
  PokemonBadRequestMissingAfter,
  PokemonDbError,
  PokemonNotFoundError,
  PokemonDuplicateError,
  PokemonNoSuchRouteError,
  PokemonAuthError
} = require("./errors.js")
const { populate } = require("./userModel.js")
const { populatePokemons } = require("./populatePokemons.js")

const app = express()
var pokeModel = null;

const PORT = 6010;


const start = asyncWrapper(async () => {
  await connectDB({ "drop": false });
  const pokeSchema = await getTypes();
  // populatePokemons(pokeSchema);
  pokeModel = mongoose.model('pokemons', pokeSchema);

  app.listen(PORT, async (err) => {
    if (err)
      throw new PokemonDbError(err)
    else
      console.log(`Phew! Server is running on port: ${PORT}`);

    const doc = await userModel.findOne({ "username": "admin" })
    if (!doc)
      userModel.create({ username: "admin", password: bcrypt.hashSync("admin", 10), role: "admin", email: "admin@admin.ca" })
    const doc2 = await userModel.findOne({ "username": "user" })
  })
})
start()

let ip, method,url,userid;

const schema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  tracked_date: { type: String, required: true },
  user: { type: String, required: true },
  endpoint: { type: String, required: true },
  response_code: { type: Number, required: true },
  message: { type: String, required: true },
});

const Report = mongoose.model("reports", schema);

const trackRoute = async (req, res, next) => {
  res.on("finish", async () => {
    let currentDate = new Date();
    await Report.create({
      timestamp: currentDate,
      tracked_date: currentDate.toJSON().slice(0, 10),
      user: req.user ? req.user : "Visitor",
      endpoint: (req.baseUrl == undefined ? "" : req.baseUrl) + req.path,
      response_code: res.statusCode,
      message: res.statusMessage,
    });
  });
  next();
};

app.use(trackRoute);

app.use(express.json())
app.use(morgan(":method"))

app.use(cors({
  exposedHeaders: ['Authorization']
}))

app.post('/register', asyncWrapper(async (req, res) => {
  const { username, password, role, email } = req.body
  if (!username || !password || !role || !email) {
    throw new PokemonAuthError("Missing fields: Please provide a username, password, role and email.")
  }
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  const userWithHashedPassword = { ...req.body, password: hashedPassword }

  try {
    const user = await userModel.create(userWithHashedPassword)
    res.send(user)
  } catch (error) {
    throw new PokemonAuthError("User already exists: Please provide a different username.")
  }
}))

let refreshTokens = [] // replace with a db

app.post('/requestNewAccessToken', asyncWrapper(async (req, res) => {
  const tokenParsed = req.header('Authorization').split(" ");
  const refresh = tokenParsed[2];
  const refreshToken = tokenParsed[3];

  if (refresh !== "Refresh" || !refreshToken) {
    throw new PokemonAuthError("No Token: Please provide a token.");
  }

  if (!refreshTokens.includes(refreshToken)) { // replaced a db access
    throw new PokemonAuthError("Invalid Token: Please provide a valid token.")
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const accessToken = jwt.sign({
      user:
      {
        username: payload.user.username,
        password: payload.user.password,
        role: payload.user.role,
      }
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' })

    const updated = await userModel.findOneAndUpdate({ username: payload.user.username }, { token: accessToken, token_invalid: false }, { new: true })

    res.header('Authorization', `Bearer ${accessToken} Refresh ${refreshToken}`)
    res.send(updated)
  } catch (error) {
    throw new PokemonAuthError("Invalid Token: Please provide a valid token.")
  }

}))
app.post('/login', asyncWrapper(async (req, res) => {
  const { username, password } = req.body
  const user = await userModel.findOne({ username })
  if (!user)
    throw new PokemonAuthError("User not found")

  const isPasswordCorrect = await bcrypt.compare(password, user.password)
  if (!isPasswordCorrect)
    throw new PokemonAuthError("Password is incorrect")

  const accessToken = jwt.sign({
    user: {
      username: user.username,
      password: user.password,
      role: user.role,
    }
  },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '10s' })
  const refreshToken = jwt.sign({
    user: {
      username: user.username,
      password: user.password,
      role: user.role,
    }
  },
    process.env.REFRESH_TOKEN_SECRET)
  refreshTokens.push(refreshToken)

  try {
    const updated = await userModel.findOneAndUpdate({ username: user.username }, { token: accessToken, token_invalid: false }, { new: true })

    res.header('Authorization', `Bearer ${accessToken} Refresh ${refreshToken}`)
    res.send({ 'user': updated, 'refreshTokens': refreshTokens })
  } catch (error) {
    throw new PokemonAuthError(error)
  }
}))


app.post('/logout', asyncWrapper(async (req, res) => {
  const auth = req.header('Authorization');
  console.log("logout auth: " + auth);
  if (auth === undefined || auth === null) {
    throw new PokemonAuthError("Token format invalid. Please log in again.")
  }
  const tokenParsed = auth.split(" ");
  if (tokenParsed.length < 4) {
    throw new PokemonAuthError("Token format invalid. Please log in again.")
  }
  const bearer = tokenParsed[0];
  const accessToken = tokenParsed[1];
  const refreshToken = tokenParsed[3];

  try {
    const user = await userModel.findOne({ token: accessToken })
    const updated = await userModel.findOneAndUpdate({ token: user.token }, { token: "", token_invalid: true }, { new: true })
    refreshTokens = refreshTokens.filter(token => token !== refreshToken)

    res.send({ 'user': updated, 'refreshTokens': refreshTokens })
  } catch (error) {
    throw new PokemonAuthError("User not found")
  }
}))

const authUser = asyncWrapper(async (req, res, next) => {
  const authHeader = req.header('Authorization')
  if (authHeader === undefined) {
    throw new PokemonAuthError("Token format invalid. Please log in again.")
  }

  const tokenParsed = authHeader.split(" ");

  let bearer, token, refresh, refreshToken;

  if (tokenParsed.length < 4) {
    throw new PokemonAuthError("Token format invalid. Please log in again.")
  } else {
    bearer = tokenParsed[0]
    token = tokenParsed[1]
    refresh = tokenParsed[2]
    refreshToken = tokenParsed[3]
  }

  if (bearer != "Bearer" || !token) {
    throw new PokemonAuthError("No Token: Please provide the access token using the headers.")
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const refreshPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await userModel.findOne({ "username": payload.user.username })

    if (user.token_invalid === true) {
      throw new PokemonAuthError()
    }
    req.token = token;
    next()
  } catch (err) {
    throw new PokemonAuthError("Invalid Token Verification. Log in again.")
  }
})

const authAdmin = asyncWrapper(async (req, res, next) => {
  const authHeader = req.header('Authorization')
  const tokenParsed = authHeader && authHeader.split(" ");
  const tokenType = tokenParsed[0]
  const token = tokenParsed[1]

  if (tokenType == "Bearer" || token) {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await userModel.findOne({ "username": payload.user.username })
    if (user.role == "admin") {
      return next()
    }
    throw new PokemonAuthError("Access denied")
  }
})

app.use(authUser) // Boom! All routes below this line are protected

app.get('/api/v1/pokemons', asyncWrapper(async (req, res) => {
  const docs = await pokeModel.find({})
    .sort({ "id": 1 })
    .skip(req.query["after"])
    .limit(req.query["count"])
  res.json(docs)
}))

app.get('/api/v1/pokemon', asyncWrapper(async (req, res) => {
  const { id } = req.query
  const docs = await pokeModel.find({ "id": id })
  if (docs.length != 0) {
    res.json(docs);
  }
  else throw new PokemonNotFoundError("Pokemon not found")
}))

app.use(authAdmin)

app.post('/api/v1/pokemon/', asyncWrapper(async (req, res) => {
  if (!req.body.id) throw new PokemonBadRequestMissingID()
  const poke = await pokeModel.find({ "id": req.body.id })
  if (poke.length != 0) throw new PokemonDuplicateError()
  const pokeDoc = await pokeModel.create(req.body)
  console.log(pokeDoc);
  res.json({
    msg: "Added Successfully"
  })
}))

app.delete('/api/v1/pokemon', asyncWrapper(async (req, res) => {
  const docs = await pokeModel.findOneAndRemove({ id: req.query.id })
  if (docs) {
    res.json({
      msg: "Deleted Successfully"
    })
  }
  else
    throw new PokemonNotFoundError("");
}))

app.put('/api/v1/pokemon/:id', asyncWrapper(async (req, res) => {
  const selection = { id: req.params.id }
  const update = req.body
  const options = {
    new: true,
    runValidators: true,
    overwrite: true
  }
  const doc = await pokeModel.findOneAndUpdate(selection, update, options)
  if (doc) {
    res.json({
      msg: "Updated Successfully",
      pokeInfo: doc
    })
  } else {
    throw new PokemonNotFoundError("");
  }
}))

app.patch('/api/v1/pokemon/:id', asyncWrapper(async (req, res) => {
  const selection = { id: req.params.id }
  const update = req.body
  const options = {
    new: true,
    runValidators: true
  }
  const doc = await pokeModel.findOneAndUpdate(selection, update, options)
  if (doc) {
    res.json({
      msg: "Updated Successfully",
      pokeInfo: doc
    })
  } else {
    throw new PokemonNotFoundError("");
  }
}))

app.get("/report", async (req, res) => {
  const id = req.query.id;
  const dateOffset = 24 * 60 * 60 * 1000 * 7; //7 days
  const currentDate = new Date();
  var startDate = new Date();
  startDate.setDate(currentDate.getTime() - dateOffset);
  var result;
  switch (id) {
    case "1":
      result = await Report.aggregate([
        {
          $match: { timestamp: { $gte: startDate, $lte: currentDate } },
        },
        {
          $group: {
            _id: {
              unique_user: "$user",
              tracking_date: "$tracked_date",
            },
          },
        },
        {
          $group: {
            _id: "$_id.tracking_date",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        {
          $project: {
            _id: 0,
            tracking_date: "$_id",
            count: "$count",
          },
        },
      ]);
      res.json(result);
      break;
    case "2":
      result = await Report.aggregate([
        {
          $match: { timestamp: { $gte: startDate, $lte: currentDate } },
        },
        {
          $group: {
            _id: "$user",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            user: "$_id",
            count: "$count",
          },
        },
      ]);
      res.json(result);
      break;
    case "3":
      result = await Report.aggregate([
        {
          $facet: {
            "/register": [
              { $match: { endpoint: "/register" } },
              { $group: { _id: "$user", count: { $sum: 1 } } },
              { $sort: { count: -1, _id: -1 } },
              { $limit: 3 },
              {
                $project: {
                  _id: 0,
                  user: "$_id",
                  count: "$count",
                },
              },
            ],
            "/login": [
              { $match: { endpoint: "/login" } },
              { $group: { _id: "$user", count: { $sum: 1 } } },
              { $sort: { count: -1, _id: -1 } },
              { $limit: 3 },
              {
                $project: {
                  _id: 0,
                  user: "$_id",
                  count: "$count",
                },
              },
            ],
            "/requestNewAccessToken": [
              { $match: { endpoint: "/requestNewAccessToken" } },
              { $group: { _id: "$user", count: { $sum: 1 } } },
              { $sort: { count: -1, _id: -1 } },
              { $limit: 3 },
              {
                $project: {
                  _id: 0,
                  user: "$_id",
                  count: "$count",
                },
              },
            ],
            "/report": [
              { $match: { endpoint: "/report" } },
              { $group: { _id: "$user", count: { $sum: 1 } } },
              { $sort: { count: -1, _id: -1 } },
              { $limit: 3 },
              {
                $project: {
                  _id: 0,
                  user: "$_id",
                  count: "$count",
                },
              },
            ],
            "/logout": [
              { $match: { endpoint: "/logout" } },
              { $group: { _id: "$user", count: { $sum: 1 } } },
              { $sort: { count: -1, _id: -1 } },
              { $limit: 3 },
              {
                $project: {
                  _id: 0,
                  user: "$_id",
                  count: "$count",
                },
              },
            ],
          },
        },
      ]);
      res.json(result);
      break;
    case "4":
      result = await Report.aggregate([
        { $match: { response_code: { $gte: 400, $lte: 599 } } },
        {
          $facet: {
            "/register": [
              { $match: { endpoint: "/register" } },
              {
                $group: {
                  _id: {
                    error_code: "$response_code",
                    message: "$message",
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: -1 } },
              {
                $project: {
                  _id: 0,
                  error_code: "$_id.error_code",
                  message: "$_id.message",
                  count: "$count",
                },
              },
            ],
            "/login": [
              { $match: { endpoint: "/login" } },
              {
                $group: {
                  _id: {
                    error_code: "$response_code",
                    message: "$message",
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: -1 } },
              {
                $project: {
                  _id: 0,
                  error_code: "$_id.error_code",
                  message: "$_id.message",
                  count: "$count",
                },
              },
            ],
            "/requestNewAccessToken": [
              { $match: { endpoint: "/requestNewAccessToken" } },
              {
                $group: {
                  _id: {
                    error_code: "$response_code",
                    message: "$message",
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: -1 } },
              {
                $project: {
                  _id: 0,
                  error_code: "$_id.error_code",
                  message: "$_id.message",
                  count: "$count",
                },
              },
            ],
            "/report": [
              { $match: { endpoint: "/report" } },
              {
                $group: {
                  _id: {
                    error_code: "$response_code",
                    message: "$message",
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: -1 } },
              {
                $project: {
                  _id: 0,
                  error_code: "$_id.error_code",
                  message: "$_id.message",
                  count: "$count",
                },
              },
            ],
            "/logout": [
              { $match: { endpoint: "/logout" } },
              {
                $group: {
                  _id: {
                    error_code: "$response_code",
                    message: "$message",
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: -1 } },
              {
                $project: {
                  _id: 0,
                  error_code: "$_id.error_code",
                  message: "$_id.message",
                  count: "$count",
                },
              },
            ],
          },
        },
      ]);
      res.json(result);
      break;
    case "5":
      result = await Report.aggregate([
        { $match: { response_code: { $gte: 400, $lte: 599 } } },
        { $sort: { timestamp: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            timestamp: "$timestamp",
            user: "$user",
            endpoint: "$endpoint",
            response_code: "$response_code",
            message: "$message",
          },
        },
      ]);
      res.json(result);
      break;
    default:
      res.status(404).send("Report not found.");
  }
});



// s1();




// app.get('/report/:id', asyncWrapper(async (req, res) => {
//     console.log(`requestedBy: ${req.query.id}`);
//     let resid = req.params.id;
//     const report = await s1();
//     if(resid == 1){ res.send(report.report1) }
//     if(resid == 2){ res.send(report.report2) }
//     if(resid == 3){ res.send(report.report3) }
//     if(resid == 4){ res.send(report.report4) }
//     if(resid == 5){ res.send(report.report5) }
// }))

app.use(handleErr)

module.exports = app;