const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const _ = require("lodash");
const {
  get
} = require("lodash");
const {
  JSDOM
} = require("jsdom");
const marked = require("marked");
const createDomPurifier = require("dompurify");
const dompurify = createDomPurifier(new JSDOM().window);
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose_fuzzy_searching = require("mongoose-fuzzy-searching");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.json({
  limit: "50mb",
  extended: true
}));
app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: true
}));
app.use(express.static("public"));
app.use(
  session({
    secret: "nimedesu by yunstech.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://yunstech:085862525407@nimedesu.drpdp.mongodb.net/NimeDesuDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.set("useCreateIndex", true);

const storage = multer.diskStorage({
  destination: "./public/upload/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("imageContent");

const editImage = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("imageEdit");

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Errors: Images Only!");
  }
}
const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
});

adminSchema.plugin(passportLocalMongoose);

const Admin = mongoose.model("Admin", adminSchema);

passport.use(Admin.createStrategy());

passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

const genreSchema = new mongoose.Schema({
  genre: String,
});
const carouselSchema = new mongoose.Schema({
  imgCarousel: String,
  title: String,
  deskripsi: String,
});

const Carousel = mongoose.model('Carousel', carouselSchema)

const Genre = mongoose.model("Genre", genreSchema);

const animeInfoSchema = new mongoose.Schema({
  judul: String,
  judulAlternatif: String,
  jumlahEpisode: String,
  jumlahEpisodeTelahRilis: String,
  musimRilis: String,
  tanggalTayang: String,
  studio: String,
  durasi: String,
  skor: String,
  credit: String,
  genre: Array,
  sinopsis: String,
  link: String,
  type: String,
  img: String,
  progress: String,
  created_on: String,
  edited_on: String,
  hariRilis: String,
  sanitizeHtml: String,
}, {
  typeKey: "$type"
});
animeInfoSchema.plugin(mongoose_fuzzy_searching, {
  fields: ["judul", "judulAlternatif"],
});
const AnimeInfo = mongoose.model("AnimeInfo", animeInfoSchema);

function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + " ...";
}

const postSchema = new mongoose.Schema({
  faq: String,
});

const PostSchema = mongoose.model("PostSchema", postSchema);

animeInfoSchema.pre("validate", function (next) {
  if (this.link) {
    this.sanitizeHtml = dompurify.sanitize(marked(this.link));
  }
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

let stringToHTML = function (str) {
  // If DOMParser is supported, use it
  if (support) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(str, "text/html");
    return doc.body;
  }

  // Otherwise, fallback to old-school method
  let dom = document.createElement("div");
  dom.innerHTML = str;
  return dom;
};

function urlEncode(link) {
  let name = link;
  let encodedLink = name.replace(/\s/g, '-');
  return encodedLink
}





// *************  ROUTE  ************** \\


app.get('/upload-image', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('upload-image')
  } else {
    res.redirect('/admin021224')
  }
})

app.get('/more/:postID', function (req, res) {

  const requestedPostId = req.params.postID;
  class UserPaginationExample {
    getAll(limit = 0, skip = 0) {
      return UsersModel.find({
          type: requestedPostId
        }) // You may want to add a query
        .sort({
          _id: -1
        }) // Use this to sort documents by newest first
        .skip(skip) // Always apply 'skip' before 'limit'
        .limit(limit) // This is your 'page size'
    }
  }
})


app.get("/", function (req, res) {
  Carousel.find({}, function (err, carouselResult) {
    if (err) {
      return null;
    } else {
      AnimeInfo.find({
        type: "completed"
      }).sort({
        edited_on: 1
      }).exec(function (err, completed) {
        if (err) {
          res.render("404");
        } else {
          AnimeInfo.find({
            type: "ongoing"
          }).sort({
            edited_on: 1
          }).exec(function (err, docs) {
            if (err) {
              res.render("404");
            } else {
              res.render("index", {
                completed: completed,
                ongoing: docs,
                truncateString: truncateString,
                change: urlEncode,
                carousel: carouselResult
              });
            }
          });
        }
      });
    }
  })

});

app.get("/daftar-anime", function (req, res) {
  const today = new Date();
  AnimeInfo.find({}, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.render("daftar-anime", {
        anime: result,
        date: today.getFullYear(),
        truncateString: truncateString,
        change: urlEncode,
      });
    }
  });
});


app.get("/anime/:postId", function (req, res) {
  const requestedPostId = req.params.postId;
  let cleanedLink = requestedPostId.replace(/-/g, ' ');
  console.log(cleanedLink)
  const today = new Date();

  AnimeInfo.findOne({
    judul: cleanedLink
  }, function (err, post) {
    if (err) {
      res.render("404");
    } else {
      res.render("anime", {
        info: post,
        date: today.getFullYear(),
      });
    }
  });
});

app.get("/genre", function (req, res) {
  if (req.isAuthenticated()) {
    Genre.find({}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("genre-admin", {
          genre: result,
        });
      }
    });
  } else {
    Genre.find({}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("genre", {
          genre: result,
          change: urlEncode,
        });
      }
    });
  }
});

app.get("/admin021224", function (req, res) {
  if (req.isAuthenticated()) {
    AnimeInfo.find({}, function (err, found) {
      if (err) {
        res.render("404");
      } else {
        res.render("admin", {
          post: found,
          truncateString: truncateString,
        });
      }
    });
  } else {
    res.render("admin-login", {});
  }
});

app.get("/register", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("register");
  } else {
    res.redirect("/admin021224");
  }
});

app.get('/jadwal-rilis', function (req, res) {
  AnimeInfo.find({
    type: "ongoing"
  }, function (err, result) {
    if (err) {
      console.log(err);
      res.render('404')
    } else {
      res.render('jadwalRilis', {
        post: result,
        truncateString: truncateString,
        change: urlEncode,
      })
    }
  })

})

app.get("/404", function (req, res) {
  res.render("404");
});

app.get("/forgot-password", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("forgot-password");
  } else {
    res.redirect("/admin021224");
  }
});

app.get("/upload", function (req, res) {
  if (req.isAuthenticated()) {
    Genre.find({}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("upload", {
          genre: result,
        });
      }
    });
  } else {
    res.redirect("/admin021224");
  }
});

app.get("/delete", function (req, res) {
  if (req.isAuthenticated()) {
    AnimeInfo.find({}, function (err, found) {
      if (err) {
        res.render("404");
      } else {
        res.render("delete", {
          post: found,
          truncateString: truncateString,
        });
      }
    });
  } else {
    res.redirect("/admin021224");
  }
});

app.get("/edit/:postId", function (req, res) {
  if (req.isAuthenticated()) {
    const requestedPostId = req.params.postId;

    AnimeInfo.findOne({
      _id: requestedPostId
    }, function (err, post) {
      if (err) {
        res.render("404");
      } else {
        Genre.find({}, function (err, result) {
          if (err) {
            console.log(err);
          } else {
            res.render("edit", {
              info: post,
              genre: result,
            });
          }
        });
      }
    });
  } else {
    res.redirect("/admin021224");
  }
});

app.get("/search", function (req, res) {
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    AnimeInfo.find({
      judul: regex
    }, function (err, found) {
      if (err) {
        console.log(err);
      } else {
        res.render("search", {
          post: found,
          truncateString: truncateString,
          search: req.query.search,
          change: urlEncode,
        });
      }
    });
  }
});

app.get("/faq", function (req, res) {
  if (req.isAuthenticated()) {
    PostSchema.find({}, function (err, found) {
      res.render("faq-admin", {
        post: found,
      });
    });
  } else {
    PostSchema.find({}, function (err, found) {
      res.render("faq", {
        post: found,
      });
    });
  }
});

app.get("/delete/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  AnimeInfo.deleteOne({
    _id: requestedPostId
  }, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin021224");
    }
  });
});

app.get("/search/:postId", function (req, res) {
  const requestedPostId = req.params.postId;
  let cleanedLink = requestedPostId.replace(/-/g, ' ');
  console.log(cleanedLink)
  Genre.findOne({
    genre: cleanedLink
  }, function (err, found) {
    AnimeInfo.find({
      genre: found.genre
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("search", {
          post: result,
          truncateString: truncateString,
          search: found.genre,
          change: urlEncode,
        });
      }
    });
  });
});

app.post("/add-genre", function (req, res) {
  const newGenre = new Genre({
    genre: req.body.genre,
  });

  newGenre.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      Genre.find({}, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          res.render("genre-admin", {
            genre: result,
          });
        }
      });
    }
  });
});

app.post("/upload-content", function (req, res) {
  let d = new Date(),
    month = (d.getMonth() + 1),
    day = d.getDate(),
    year = d.getFullYear(),
    hours = d.getHours()

  let dates = `${ year } - ${ month } - ${ day } - ${ hours }`;
  upload(req, res, (err) => {
    if (err) {
      res.render("404");
    } else {
      if (req.file == undefined) {
        res.render("404");
      } else {
        let today = new Date();
        const newAnimeInfo = new AnimeInfo({
          judul: req.body.judulContent,
          judulAlternatif: req.body.judulAlternatif,
          jumlahEpisode: req.body.jumlahEpisode,
          jumlahEpisodeTelahRilis: req.body.jumlahEpisodeTelahRilis,
          musimRilis: req.body.musimRilis,
          tanggalTayang: req.body.tanggalTayang,
          studio: req.body.studio,
          durasi: req.body.durasi,
          skor: req.body.skor,
          credit: req.body.credit,
          genre: req.body.genre,
          sinopsis: req.body.sinopsis,
          link: req.body.link,
          type: req.body.option,
          img: req.file.filename,
          created_on: dates,
          edited_on: dates,
          progress: req.body.progress,
          hariRilis: req.body.hariRilis
        });

        newAnimeInfo.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            AnimeInfo.find({}, function (err, found) {
              if (err) {
                res.render("404");
              } else {
                res.render("admin", {
                  post: found,
                  truncateString: truncateString,
                });
              }
            });
          }
        });
      }
    }
  });
});

app.post('/upload-carousel', function (req, res) {

  upload(req, res, (err) => {
    if (err) {
      res.render("404");
    } else {
      if (req.file == undefined) {
        res.render("404");
      } else {
        const newImg = new Carousel({
          imgCarousel: req.file.filename,
          title: req.body.title,
          deskripsi: req.body.deskripsi
        });

        newImg.save(function (err) {
          if (err) {
            console.log(err);
          } else {

            res.redirect('/')
          }
        });
      }
    }
  });
})

app.post("/edit-post", function (req, res) {
  const newPost = new PostSchema({
    faq: req.body.faq,
  });

  newPost.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      PostSchema.find({}, function (err, found) {
        res.render("faq", {
          post: found,
        });
      });
    }
  });
});

app.post("/edit-content/:postId", function (req, res) {
  let d = new Date(),
    month = (d.getMonth() + 1),
    day = d.getDate(),
    year = d.getFullYear();
  var h = d.getHours();
  var m = d.getMinutes();
  var s = d.getSeconds();
  let x = h + ":" + m + ":" + s;

  let dates = `${ year } - ${ month } - ${ day } - ${ x }`;
  const requestedPostId = req.params.postId;

  editImage(req, res, (err) => {
    if (err) {
      res.render("404");
      console.log(err);
    } else {
      if (req.file == undefined) {
        let objForUpdate = {};
        if (req.body.judulContent) objForUpdate.judul = req.body.judulContent;
        if (req.body.judulAlternatif)
          objForUpdate.judulAlternatif = req.body.judulAlternatif;
        if (req.body.jumlahEpisode)
          objForUpdate.jumlahEpisode = req.body.jumlahEpisode;
        if (req.body.jumlahEpisodeTelahRilis)
          objForUpdate.jumlahEpisodeTelahRilis =
          req.body.jumlahEpisodeTelahRilis;
        if (req.body.musimRilis)
          objForUpdate.musimRilis = req.body.jumlahmusimRilispisode;
        if (req.body.tanggalTayang)
          objForUpdate.tanggalTayang = req.body.tanggalTayang;
        if (req.body.studio) objForUpdate.studio = req.body.studio;
        if (req.body.durasi) objForUpdate.durasi = req.body.durasi;
        if (req.body.skor) objForUpdate.skor = req.body.skor;
        if (req.body.credit) objForUpdate.credit = req.body.credit;
        if (req.body.genre) objForUpdate.genre = req.body.genre;
        if (req.body.sinopsis) objForUpdate.sinopsis = req.body.sinopsis;
        if (req.body.link) objForUpdate.link = req.body.link;
        if (req.body.progress) objForUpdate.progress = req.body.progress;
        if (req.body.option) objForUpdate.type = req.body.option;
        if (req.body.hariRilis) objForUpdate.hariRilis = req.body.hariRilis;
        objForUpdate.edited_on = dates;

        //before edit- There is no need for creating a new variable
        //var setObj = { $set: objForUpdate }

        objForUpdate = {
          $set: objForUpdate
        };

        AnimeInfo.updateOne({
          _id: requestedPostId
        }, objForUpdate, function (
          err
        ) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/admin021224");
          }
        });
      } else {
        let objForUpdate = {};
        if (req.body.judulContent) objForUpdate.judul = req.body.judulContent;
        if (req.body.judulAlternatif)
          objForUpdate.judulAlternatif = req.body.judulAlternatif;
        if (req.body.jumlahEpisode)
          objForUpdate.jumlahEpisode = req.body.jumlahEpisode;
        if (req.body.jumlahEpisodeTelahRilis)
          objForUpdate.jumlahEpisodeTelahRilis =
          req.body.jumlahEpisodeTelahRilis;
        if (req.body.musimRilis)
          objForUpdate.musimRilis = req.body.jumlahmusimRilispisode;
        if (req.body.tanggalTayang)
          objForUpdate.tanggalTayang = req.body.tanggalTayang;
        if (req.body.studio) objForUpdate.studio = req.body.studio;
        if (req.body.durasi) objForUpdate.durasi = req.body.durasi;
        if (req.body.skor) objForUpdate.skor = req.body.skor;
        if (req.body.credit) objForUpdate.credit = req.body.credit;
        if (req.body.genre) objForUpdate.genre = req.body.genre;
        if (req.body.sinopsis) objForUpdate.sinopsis = req.body.sinopsis;
        if (req.body.link) objForUpdate.link = req.body.link;
        if (req.body.progress) objForUpdate.progress = req.body.progress;
        if (req.body.option) objForUpdate.type = req.body.option;
        if (req.file) objForUpdate.img = req.file.filename;
        if (req.body.hariRilis) objForUpdate.hariRilis = req.body.hariRilis;
        objForUpdate.edited_on = dates;

        //before edit- There is no need for creating a new variable
        //var setObj = { $set: objForUpdate }

        objForUpdate = {
          $set: objForUpdate
        };

        AnimeInfo.updateOne({
          _id: requestedPostId
        }, objForUpdate, function (
          err
        ) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/admin021224");
          }
        });
      }
    }
  });
});

app.post("/register", function (req, res) {
  Admin.register({
      username: req.body.adminEmail
    },
    req.body.adminPassword,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          AnimeInfo.find({}, function (err, found) {
            if (err) {
              res.render("404");
            } else {
              res.render("admin", {
                post: found,
                truncateString: truncateString,
              });
            }
          });
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const admin = new Admin({
    username: req.body.adminEmail,
    password: req.body.adminPassword,
  });

  req.login(admin, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        AnimeInfo.find({}, function (err, found) {
          if (err) {
            res.render("404");
          } else {
            res.render("admin", {
              post: found,
              truncateString: truncateString,
            });
          }
        });
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// app.listen(3000, function () {
//   console.log("server running");
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("server is running sucessfully");
});