require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

const port = 3000 || process.env.PORT;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.DB_URL);


const itemsSchema = mongoose.Schema({
  name: { type: String, required: true }
});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});


const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("list", listSchema);


async function insertDoc(newItem) {
  try {
    await newItem.save();
  } catch (err) {
    console.log(err);
  }
}

async function deleteDoc(id) {
  try {
    await Item.findByIdAndRemove(id)
  } catch (err) {
    console.log(err);
  }
}


app.get("/", async function (req, res) {
  const item = await Item.find();
  res.render("list", { listTitle: "Today's Todolist", newListItems: item });

});

// Comment

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today's Todolist") {
    insertDoc(newItem).then(() => {
      res.redirect("/");
    });
  } else {

    try {
      foundList = await List.findOne({ name: listName })
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);

    } catch (err) {
      console.log(err);
    }
  }


});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today's Todolist") {
    deleteDoc(checkedItemId);
    res.redirect("/");
  } else {
    // console.log(checkedItemId);
    // console.log(listName);
    try {
      const x = await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
      res.redirect("/" + listName);

    } catch (err) {
      console.log(err);
    }
  }
});


app.get("/:paramName", async function (req, res) {

  const nameOfList = _.capitalize(req.params.paramName);

  const name = await List.findOne({ name: nameOfList });
  if (!name) {
    const list = new List({
      name: nameOfList,
      items: []
    })
    await list.save();
    res.redirect("/" + nameOfList);
  } else {
    res.render("list", { listTitle: name.name, newListItems: name.items });
  }
});


app.listen(port, function () {
  console.log("Server started on port 3000");
});
