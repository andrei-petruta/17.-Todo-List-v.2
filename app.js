const express = require("express");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config()

mongoose.set('useFindAndModify', false);


app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static("public"));

app.set("view engine", "ejs");


// MONGO CONNECTION
mongoose.connect(`mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}`, {useNewUrlParser: true, useUnifiedTopology: true});


// MONGO SCHEMAS
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
})

const Item = mongoose.model("Item", itemsSchema);


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



// DEFAULT ITEMS ON TO DO LIST
const item1 = new Item({
  name: "Welcome to your to do list!"
});
const item2 = new Item({
  name: "Click the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];



// GET/POST METHODS FOR HOMEPAGE && POST FOR WORK PAGE
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Added all default items in the list!");
        }
      })      
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
})


app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;


    const item = new Item({
      name: itemName
    });

    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({name: listName}, function(err, foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
      })
    }


})

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully removed item!");
      }
    })
  
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect(`/${listName}`);
      }
    })
  }
  
})



// GET METHOD FOR DYNAMIC ROUTES
app.get("/:customListName", function(req, res) {
  const newListName = _.capitalize(req.params.customListName);


  List.findOne({name: newListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: newListName,
          items: defaultItems
        })
      
        list.save();

        res.render("list", {listTitle: list.name, newListItems: list.items});
    } else {
      // Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
})
  

  
})



// SETTING UP PORT 
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("Server has started successfully!");
})