const express = require('express');
const Plant = require('../models/Plant');
const router = express.Router();


// helper: simple shared password check (optional)
function checkAuth(req,res,next){
const pass = req.headers['x-app-pass'] || req.query.appPass;
if(process.env.SHARED_APP_PASSWORD && pass !== process.env.SHARED_APP_PASSWORD){
return res.status(401).json({ error: 'Unauthorized - provide X-App-Pass header' });
}
next();
}


router.use(checkAuth);


router.get('/', async (req,res)=>{
const plants = await Plant.find().sort({createdAt:-1});
res.json(plants);
});


router.get('/:id', async (req,res)=>{
const p = await Plant.findById(req.params.id);
if(!p) return res.status(404).json({ error: 'Not found' });
res.json(p);
});


router.post('/', async (req,res)=>{
const body = req.body;
const plant = new Plant(body);
await plant.save();
res.status(201).json(plant);
});


router.put('/:id', async (req,res)=>{
const updated = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true });
res.json(updated);
});


router.delete('/:id', async (req,res)=>{
await Plant.findByIdAndDelete(req.params.id);
res.json({ ok: true });
});


// mark watered now
router.post('/:id/water', async (req,res)=>{
const plant = await Plant.findById(req.params.id);
if(!plant) return res.status(404).json({ error: 'Not found' });
plant.lastWateredAt = new Date();
await plant.save();
res.json(plant);
});


module.exports = router;