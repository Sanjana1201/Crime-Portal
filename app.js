//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const alert = require('alert');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// <<<<<<<<<<<--------------db setup-------------->>>>>>>>>>

mongoose.connect("mongodb://localhost:27017/crimeDB",{ useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  name: String,
  googleId: String,
  email: String,
  password: String,
  address: String,
  aadharNumber: Number,
  gender: String,
  number: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/crime"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const complainSchema = new mongoose.Schema({
  state: String,
  aadharnumber: Number,
  location: String,
  type: String,
  date: String,
  description: String,
  policeId: String,
  LatestUpdateDate: String,
  LatestUpdate: String,
  finalStatement: String
});

const Complaint = mongoose.model("Complaint",complainSchema);


const policeStationSchema = new mongoose.Schema({
  state: String,
  location: String,
  inchargeName:String,
  inchargeId: String,
  password: String,
  policeID: String
});

const policeStation = mongoose.model("policeStation",policeStationSchema);

const policeInspectorSchema = new mongoose.Schema({
  name: String,
  specialist: String,
  location: String,
  state: String,
  policeId: String,
  password: String
});

const policeInspector = mongoose.model("policeInspector",policeInspectorSchema);

// <<<<<---------------setup--------------->>>>>>>>>>>

const year = new Date().getFullYear();
const date = new Date();
function formatDateToString(date){
   // 01, 02, 03, ... 29, 30, 31
   var dd = (date.getDate() < 10 ? '0' : '') + date.getDate();
   // 01, 02, 03, ... 10, 11, 12
   var MM = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
   // 1970, 1971, ... 2015, 2016, ...
   var yyyy = date.getFullYear();

   // create the format you want
   return (yyyy + "-" + MM + "-" + dd );
}
// const printDate = year + "-" + month + "-" + date;
const dateString = formatDateToString(date);
// <<<<<<<<<<<<------------------------app.gets-------------------------->>>>>>>>>>>>>>>>>
app.get("/",function(req,res){
  res.render("home",{currentYear: year});
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/crime",
  passport.authenticate("google", { failureRedirect: "/userlogin" }),
  function(req, res) {
    // Successful authentication, redirect to next step.
    User.findOne({_id: req.user._id},function(err,user){
      if(err){
        console.log(err);
      }
      else{
        // console.log(user._id);
        if(user.aadharNumber === undefined){
          res.redirect( "/" + user._id + "/register");
        }
        else{
          res.redirect( "/" + user.aadharNumber + "/complainer_page");
        }
      }
    });
});

app.get("/registration",function(req,res){
  res.render("registration");
});

app.get("/signUp",function(req,res){
  res.render("registration_complete");
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});


//////////------------police setup----------------///////////////////

app.get("/policelogin",function(req,res){
  res.render("policelogin");
});

app.get("/:policeId/police_pending_complain",function(req,res){
  const currentPolice = req.params.policeId;
  Complaint.find(function(err,complain){
    if(!err){
      res.render("police_pending_complaint",{
        complainDetails: complain,
        currentpoliceID: currentPolice
      });
    }
  });
});

app.get("/:policeId/police_complete",function(req,res){
  const currentPolice = req.params.policeId;
  Complaint.find(function(err,complains){
    if(!err){
      res.render("police_complete",{
        complainDetails: complains,
        currentpoliceID: currentPolice,
      });
    }
  });
});

/////////////------------incharge setup--------------///////////////////

app.get("/inchargelogin",function(req,res){
  res.render("inchargelogin");
});

app.get("/:statename/Incharge_complain_page",function(req,res){
  const stateName = req.params.statename;
  Complaint.find(function(err,complain){
    if(!err){
      res.render("Incharge_complain_page",{
        stateComplaint: complain,
        currentState: stateName
      });
    }
  })
});

app.get("/:stateName/incharge_view_police",function(req,res){
  const state = req.params.stateName;
  policeInspector.find(function(err,police){
    if(!err){
      res.render("incharge_view_police",{
        stateName: state,
        requestedPolice: police
      });
    }
  });
});

app.get("/:statename/police_add",function(req,res){
  const requiredName = req.params.statename;
  res.render("police_add",{currentUser: requiredName});
});

app.get("/:stateName/police_assign/:complainID",function(req,res){
  const requestedID = req.params.complainID;
  Complaint.findOne({_id: requestedID},function(err,complain){
    if(err){
      console.log(err);
    }
    else{
      if(complain){
        policeInspector.find(function(err,inspector){
          if(!err){
            res.render("incharge_complain_details",{
              complainNumber: complain._id,
              complainDescription: complain.description,
              complainType: complain.type,
              complainDate: complain.date,
              complainState: complain.state,
              policeList: inspector
            });
          }
        });
      }
    }
  });
});


///////////------------------head setup-------------------/////////////////


app.get("/headlogin",function(req,res){
  res.render("headlogin");
});

app.get("/headHome",function(req,res){
  Complaint.find(function(err,complain){
    if(!err){
      res.render("headHome", {
        complainDetails: complain
      })
    }
  });
});

app.get("/police_station_add",function(req,res){
  res.render("police_station_add");
});

app.get("/head_view_police_station",function(req,res){
  policeStation.find(function(err,station){
    if(!err){
      res.render("head_view_police_station", {
        requestedStation: station
      });
    }
  });
});

app.get("/delete/:inchargeid",function(req,res){
  const RequestedTitle = (req.params.inchargeid);
  policeStation.deleteOne({inchargeId:RequestedTitle},function(err){
    if(!err){
      res.redirect("/head_view_police_station");
    }
  });
});

////////////-------------------user setup-------------------/////////////
app.get("/userlogin",function(req,res){
  res.render("userlogin");
});

app.get("/:userId/complainer_page",function(req,res){
  if(req.isAuthenticated()){
    const currentUser = req.params.userId;
    User.find(function(err,user){
      if(!err){
        user.forEach(function(testUser){
          const requestedUser = testUser.aadharNumber;
          if(currentUser == requestedUser){
            res.render("complainer_page",{userName: testUser.name, userAadhar: testUser.aadharNumber, userId: testUser._id, maxdate: dateString});
          }
        });
      }
      else{
        console.log(err);
      }
    });
  }
  else{
    res.redirect("/userlogin");
  }
});

app.get("/:userId/complainer_complain_history",function(req,res){
  const currentUser = req.params.userId;
  Complaint.find(function(err,complain){
    if(!err){
      res.render("complainer_complain_history", {
        Aadhar: currentUser,
        complainDetails: complain
      })
    }
  });
});

app.get("/:aadhar/logout",function(req,res){
  res.redirect("/");
});

app.get("/:userID/register",function(req,res){
  const userid = req.params.userID;
  if(req.isAuthenticated()){
    res.render("registration_complete",{userId: userid});
  }
  else{
    res.redirect("/registration");
  }
});


// <<<<<<<<<<<-----------------------app.posts-------------------------------->>>>>>>>>>>>>>

////////////-----------------------police setup-----------------------//////////////

app.post("/policelogin",function(req,res){
  const reqemail = req.body.email;
  const reqpassword = req.body.password;
  policeInspector.findOne({policeId: reqemail},function(err,police){
    if(err){
      console.log(err);
    }
    else{
      if(police){
        if(reqpassword === police.password){
          console.log(police.state);
          res.redirect("/" + police._id + "/police_pending_complain");
        }
        else{
          console.log("Wrong password");
        }
      }
    }
  });
});

app.post("/:policeID/police_complain_search",function(req,res){
  const police = req.params.policeID;
  Complaint.findOne({_id: req.body.cid},function(err,complain){
    if(err){
      console.log(err);
    }
    else{
      if(complain){
        User.findOne({aadharNumber: complain.aadharnumber},function(err,currentUser){
          res.render("police_complaintDetails",{
            complainId: complain._id,
            complainType: complain.type,
            complainDate: complain.date,
            complainLocation: complain.location,
            complainDes: complain.description,
            userMobile: currentUser.number,
            userAddress: currentUser.address,
            updateDate: complain.LatestUpdateDate,
            update: complain.LatestUpdate,
            policeId: police,
            maxdate: dateString
          });
        });
      }
    }
  });
});

app.post("/:policeid/case_update",function(req,res){
  const redirectpath = req.params.policeid;
  Complaint.updateOne({_id: req.body.button},{LatestUpdateDate: req.body.dateOfUpdate,
  LatestUpdate: req.body.update},function(err){
    if(!err){
      console.log("Successfully updated");
      res.redirect("/" + redirectpath + "/police_pending_complain");
    }
  });
});

app.post("/:policeid/case_close",function(req,res){
  const closepoliceid = req.params.policeid;
  Complaint.updateOne({_id: req.body.button},{finalStatement: req.body.finalReport,LatestUpdate: "Case closed"},function(err){
    if(!err){
      console.log("Successfully updated");
      res.redirect("/" + closepoliceid + "/police_pending_complain");
    }
  });
});

///////////-------------------------incharge setup--------------------//////////////

app.post("/inchargelogin",function(req,res){
  const reqEmail = req.body.email;
  const reqPassword = req.body.password;
  policeStation.findOne({inchargeId: reqEmail},function(err,incharge){
    if(err){
      console.log(err);
    }
    else{
      if(incharge){
        if(reqPassword === incharge.password){
          console.log(incharge.state);
          res.redirect(incharge.state + "/Incharge_complain_page");
        }
        else{
          console.log("incorrect password");
        }
      }
    }
  })
});

app.post("/police_add",function(req,res){
  const state = req.body.button;
  const police = new policeInspector({
    name: req.body.policeName,
    specialist: req.body.policeSpecialist,
    location: req.body.location,
    state: req.body.button,
    policeId: req.body.policeid,
    password: req.body.policepassword
  });
  police.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("police Saved");
      res.redirect( state + "/incharge_view_police");
    }
  });
});

app.post("/deletePolice",function(req,res){
  const deletePolice = req.body.policeId;
  const returnState = req.body.button;
  policeInspector.deleteOne({_id: deletePolice},function(err){
    if(!err){
      res.redirect(returnState + "/incharge_view_police");
    }
    else{
      res.redirect(returnState + "/incharge_view_police");
      console.log("No such user found");
    }
  });
});

app.post("/:stateName/assign_police",function(req,res){
  const requestedState = req.params.stateName;
  Complaint.updateOne({_id: req.body.button}, {policeId: req.body.policeId},function(err){
    if(!err){
      console.log("Successfully updated");
      res.redirect( "/" + requestedState + "/Incharge_complain_page");
    }
  });
});

app.post("/:state/incharge_complain_details1",function(req,res){
  const requestedID = req.body.cid;
  Complaint.findOne({_id: requestedID},function(err,complain){
    if(err){
      console.log(err);
    }
    else{
      if(complain){
        res.render("incharge_complain_details1",{
          complainNumber: complain._id,
          complainDescription: complain.description,
          complainLocation: complain.location,
          complaintState: complain.state,
          updateDate: complain.LatestUpdateDate,
          update: complain.LatestUpdate,
          finalReport: complain.finalStatement
        });
      }
    }
  });
})

/////////////--------------------------head setup------------------------//////////

app.post("/headlogin",function(req,res){
  if(req.body.email === "head@Headquarters.com"){
    if(req.body.password === "head"){
      res.redirect("/headHome");
    }
    else{
      console.log("Wrong password");
    }
  }
  else{
    console.log("wrong ID");
  }
});

app.post("/head_case_details",function(req,res){
  const requestedID = req.body.cid;
  Complaint.findOne({_id: requestedID},function(err,complain){
    if(err){
      console.log(err);
    }
    else{
      if(complain){
        res.render("head_case_details",{
          complainNumber: complain._id,
          complainDescription: complain.description,
          complainLocation: complain.location,
          complaintState: complain.state,
          updateDate: complain.LatestUpdateDate,
          update: complain.LatestUpdate,
          policeId: complain.policeId,
          finalReport: complain.finalStatement
        });
      }
    }
  });
});

app.post("/police_station_add",function(req,res){
  console.log(req.body);
  const newStation = new policeStation({
    state: req.body.inchargeState,
    location: req.body.stationLocation,
    inchargeName: req.body.inchargeName,
    inchargeId: req.body.inchargeId,
    password: req.body.password
  });
  newStation.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully logged police station");
      res.redirect("/head_view_police_station");
    }
  });
})

////////////////--------------user setup----------------------//////////////////

app.post("/:aadhar/complainer_complain_details",function(req,res){
  const requestedID = req.body.cid;
  Complaint.findOne({_id: requestedID},function(err,complain){
    if(err){
      console.log(err);
    }
    else{
      if(complain){
        res.render("complainer_complaint_details",{
          complainNumber: complain._id,
          complainDescription: complain.description,
          updateDate: complain.LatestUpdateDate,
          update: complain.LatestUpdate,
          policeId: complain.policeId,
          finalReport: complain.finalStatement
        });
      }
    }
  });
});

app.post("/register",function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/registration");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        const send = user._id;
          res.redirect( send + "/register");
      });
    }
  });
});

app.post("/signUp",function(req,res){
  console.log(req.body);
  User.updateOne({_id: req.body.button},{
    name: req.body.name,
    address: req.body.address,
    aadharNumber: req.body.aadhar_number,
    gender: req.body.gender,
    number: req.body.mobile_number
  },function(err){
    if(!err){
        console.log("Successfully added");
        res.redirect("/" + req.body.aadhar_number + "/complainer_page");
    }
    else{
      console.log(err);
      res.redirect("/registration");
    }
  });
});


app.post("/userlogin",function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/userlogin");
    }
    else{
      passport.authenticate("local") (req,res,function(){
        const id = user.username;
        User.findOne({username: id},function(err,founduser){
          console.log(founduser);
          if(err){
            console.log(err);
            res.redirect("/userlogin")
          }
          else{
            if(founduser){
              res.redirect(founduser.aadharNumber + "/complainer_page");
            }
          }
        });
      });
    }
  });
});

app.post("/:aadhar/newComplain",function(req,res){
  const aadharNum = req.params.aadhar;
  console.log(req.body);
  const newComplaint = new Complaint({
    state: req.body.state,
    aadharnumber: req.body.button,
    location: req.body.location,
    type: req.body.type_crime,
    date: req.body.date,
    description: req.body.description
  });
  newComplaint.save(function(err){
    if(!err){
      console.log("complaint logged Successfully");
      res.redirect("/" + aadharNum + "/complainer_complain_history");
    }
    else{
      console.log(err);
    }
  });
});

app.listen(3000,function(req,res){
  console.log("Server started on port 3000");
});
