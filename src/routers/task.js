const express = require("express");
const Task = require("../models/task");
const router = new express.Router();
const auth = require("../middleware/auth");

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET /tasks   -> fetches all the completed(ie completed:true) and non completed tasks(ie completed:false)
// GET /tasks?completed=true  -> fetches only the completed tasks(ie completed:true)
// GET /tasks?completed=false  -> fetches only the non completed tasks(ie completed:false)
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc  // here : is just a special character, you can use any like _
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");

    // console.log(parts, parts[0]);
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1; // this sets like: sort.createdAt=-1(if desc) or 1(if asc, here we can pass any text for ascending or even if we don't pass any query for sorting it will give result in ascending order by default)

    // // better approach is this if you must pass a query parameter for sorting
    // if (parts[1] === "desc") {
    //   sort[parts[0]] = -1;
    // } else if (parts[1] === "asc") {
    //   sort[parts[0]] = -1;
    // }
  }

  try {
    // const tasks = await Task.find({ owner: req.user._id });
    // res.send(tasks);
    // or
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) return res.status(404).send();

    updates.forEach((update) => (task[update] = req.body[update]));

    await task.save();

    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    // you can also send the custom error
    // if(!task) return res.status(404).send({msg: 'user not found'})

    if (!task) return res.status(404).send();

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
