const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require("../middleware/authenticate");
const _ = require("lodash");

const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");

const fileUpload = multer({
  dest: "./uploads",
});

const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.sendGridKey);

const aws = require("aws-sdk");
aws.config.update({
  accessKeyId: "AKIAR6WR42SR7ZPNDLOA",
  secretAccessKey: "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",
});

const { mongoose } = require("../db/mongoose");
const { User } = require("../models/user");
const { Org } = require('../models/org');
const usertypes = require('../usertypes');

// PUT /users
router.put("/", authenticateAdmin, (req, res) => {
  const update = {};
  Object.keys(req.body).filter(d => d !== 'user_id').forEach(d => {
    update[d] = req.body[d];
  });
  User.findByIdAndUpdate(
    req.body.user_id,
    {$set: update},
    {new: true}
  ).then((user) => {
    const userJson = user.toJSON();
    const type = userJson.type || "level_1";
    userJson.permissions = usertypes[type];
    res.send(userJson);
  })
  .catch((err) => {
    res.status(400).send(err);
  });
});

// POST /users/list-users
router.post("/list-users", authenticate, (req, res) => {
  const admin_rights = req.body.admin_rights;
  const find = {};

  // if org_id is passed, filter by org_id
  if (req.body.org_id) {
    find.org_id = req.body.org_id;
  } else if (admin_rights) {
    find.org_id = { $in: admin_rights }
  }

  // for super_admins, we will show all users, default = {};

  User.find(find)
    .then((users) => {
      users = users.map(d => {
        const userJson = d.toJSON();
        const type = userJson.type || "level_1";
        userJson.permissions = usertypes[type];
        return userJson;
      })
      res.status(200).send(users);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

router.post("/upload-image",
  [authenticateAdmin, fileUpload.single("image_file")],
  async (req, res) => {
    const s3 = new aws.S3();
    const now = Date.now();

    try {
      const buffer = await sharp(req.file.path).toBuffer();

      const s3res = await s3
        .upload({
          Bucket: "prosperia-ds-platform",
          Key: `${now}-${req.file.originalname}`,
          Body: buffer,
          ACL: "public-read",
        })
        .promise();

      fs.unlink(req.file.path, () => {
        res.json({
          file: s3res.Location,
        });
      });
    } catch (err) {
      res.status(422).json({ err });
    }
  }
);

// POST /users
router.post("/", authenticateAdmin, (req, res) => {
  var body = _.pick(req.body, [
    "email", 
    "name",
    "lastname",
    "password", 
    "added_by_admin",
    "type",
    "org_id",
    "admin_rights",
  ]);

  var user = new User(body);

  user
    .save()
    .then(() => {
      res.send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

// DELETE /users
router.delete("/", (req, res) => {
  var user_id = req.body.user_id;

  if (!user_id) {
    return res.status(400).send("No User Id Provided");
  }

  User.findByIdAndDelete(user_id)
    .then(() => {
      res.status(200).send({
        status: "user deleted",
      });
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

router.post("/me", authenticate, (req, res) => {
  const user = req.user.toJSON();
  const type = user.type || "level_1";
  user.permissions = usertypes[type];
  
  if (user.org_id) {
    Org.findOne({
      '_id': user.org_id
    }).then(org => {
      res.send({ ...user, org });
    });
  } else {
    res.send(user);
  }
});

// POST /users/login
router.post("/login", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);

  User.findByCredentials(body.email, body.password)
    .then((user) => {
      const userJson = user.toJSON();
      const type = userJson.type || "level_1";
      userJson.permissions = usertypes[type];

      return user.generateAuthToken().then((token) => {
        // fetch organization
        if (userJson.org_id) {
          Org.findOne({
            '_id': userJson.org_id
          }).then(org => {
            res.header("x-auth", token).send({ ...userJson, org, });
          });
        } else {
          res.header("x-auth", token).send(userJson);
        }
      });
    })
    .catch((e) => {
      res.status(400).send();
    });
});

router.delete("/logout", authenticate, (req, res) => {
  req.user.removeToken(req.token).then(
    () => {
      res.status(200).send();
    },
    () => {
      res.status(404).send();
    }
  );
});

router.post("/change-password", authenticate, (req, res) => {
  var user = req.user;

  user.password = req.body.password;
  user.added_by_admin = false;

  user.save().then(() => {
    res.status(200).send("Password changed successfully!");
  });
});

router.post("/reset/:token", (req, res) => {
  User.findOne({
    reset_password_token: req.params.token,
    reset_password_expires: { $gt: Date.now() },
  }).then((user) => {
    if (!user) {
      return res
        .status(400)
        .send("Password reset token is invalid or has expired.");
    }

    user.password = req.body.password;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;

    user.save().then(() => {
      res.status(200).send("Password reseted successfully! Please log in.");
    });
  });
});

router.post("/forgot", (req, res) => {
  var email = req.body.email;
  var redirectUrl = req.body.redirectUrl;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.send("No account with that email address exists.");
      }

      var access = "auth";
      var token = jwt
        .sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET)
        .toString();

      user.reset_password_token = token;
      user.reset_password_expires = Date.now() + 3600000; // 1 hour

      user.save().then(() => {
        // const transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: process.env.gmail,
        //     pass: process.env.gmailPass,
        //   },
        // });

        var mailOptions = {
          to: email,
          from: "passwordreset@sociai.com",
          subject: "Sociai Password Reset",
          html: `<div>
                  <p>
                    You are receiving this because you (or someone else) have requested the reset of the password for your account.
                  </p>
                  <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                  <p>${redirectUrl}/reset?token=${token}</p>
                  <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
               </div>`,
        };

        sgMail.send(mailOptions).then(() => {
          res.send(
            "An e-mail has been sent to " +
              email +
              " with further instructions."
          );
        });
      });
    })
    .catch((e) => {
      res.status(400).send();
    });
});

module.exports = router;