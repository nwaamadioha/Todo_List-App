//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

//Create an express app
const app = express();

//set view to be able to use ejs
app.set('view engine', 'ejs');
//Allow app to use body-parser to tap into the body of requests
app.use(bodyParser.urlencoded({
  extended: true
}));
//Allow express to access the static folder
app.use(express.static("public"));

//Connect the app to the database using mongoose
mongoose.connect("mongodb+srv://admin:QWASpolk123@cluster0.sejss.mongodb.net/todolistDB");

//Create a Schema for list items
const itemsSchema = {
  name: String
};

//Create a mongoose model based on the Schema
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list"
});
const item2 = new Item({
  name: "To add items just edit the button down there"
});
const item3 = new Item({
  name: "Click on the plus button to add"
});

//Put the new items as default into an Array
const defaultItems = [item1, item2, item3];

//Schema for custom url
const listSchema = {
  name: String,
  items: [itemsSchema]
}

//Create a model for the listSchema
const List = mongoose.model("List", listSchema);


//Create a get method for our root route
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    //Check if the array is empty
    if (foundItems.length === 0) {
      // Insert the data into our database using the insertMany
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Your data was successfully saved!");
        }
      });
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

//Create a post method to add new items to our list
app.post("/", function(req, res) {
  //Get the item to be added from the input field
  const itemName = req.body.newItem;
  //Get the listTitle from the button field
  const listName = req.body.list
  //Use the item to create a new item schema
  const item = new Item({
    name: itemName
  });
  if (listName === 'Today') { //User came from the default page
    //save added items into the database
    item.save();
    //redirect back to the root route to update the lists
    res.redirect("/");
  } else { //User came from a custom list
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Create a delete method to delete items when checkbox is clicked
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === 'Today'){
    //Use the findByIdAndRemove method to delete selected item
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("successfully deleted !");
      }
    });
    //redirect back to the root to refresh the page to the updated lists
    res.redirect("/");
  }else{//$pull is a mongodb operator, omo the thing mad me
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }


});

//Define a custom list generation url
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list from the user request
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        //Save the new list into the collection
        list.save();
        //redirect back to the created list
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }

    } else {
      console.log(err);
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

//Set port to listen at heroku and at port 3000 and notify in the console
let port = process.env.PORT;
if( port == null || port = ''){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started successfully !");
});
