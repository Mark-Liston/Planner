const express = require('express');
const session = require('express-session');
const mongodbSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userModel = require('./models/User')

const app = express();
const PORT = 5000;

mongoose.connect('mongodb://localhost:27017/sessions', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() =>{
    console.log('Mongodb is connected...')
}).catch(error =>{
    console.log('Failed to connect', error)
})
const store = new mongodbSession({
    uri: 'mongodb://localhost:27017/sessions',
    collection: 'currentSession'
})

app.set('view engine', 'html');
app.use(express.static(__dirname+'/'))
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: false,
    store: store,
}))

const isAuth = (req, res, next)=>{
    if(req.session.isAuth){
        next()
    }else{
        res.redirect('/login')
    }
}


app.post('/server/login', async(req,res)=>{
    const {emailInput, passwordInput} = req.body;
    const user = await userModel.findOne({emailInput})
    if(!user){
        console.log("error:Unable to Find Login")
        return res.redirect('/login')

    }
    const isMatch = await bcrypt.compare(passwordInput, user.passwordInput);
    if(!isMatch){
        console.log('Error:Wrong password')
        return res.redirect('/login')

    }
    req.session.isAuth = true;
    console.log("logged in")
    res.redirect('/profile')

})

app.post('/register', async (req,res)=>{
    const {username, emailInput, passwordInput} = req.body;

    let user = await userModel.findOne({emailInput});
    if(user){
       // return res.redirect('/register');
    }
    const hashPassword = await bcrypt.hash(passwordInput, 10);
    user = new userModel({
        username,
        emailInput,
        passwordInput: hashpasswordInput
    })

    await user.save();
    //res.redirect('/login')
    console.log('account created')
})


app.post('/logout', (req, res)=>{
    req.session.destroy(err =>{
        if (err) throw err;
        res.redirect('/')
    })
})

app.listen(PORT, ()=>{
    console.log(`server is on port ${PORT}`)
})
