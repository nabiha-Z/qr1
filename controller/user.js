import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import User from "../models/user.js";
import Menu from "../models/menu.js";
import Survey from "../models/survey.js";
import config from "config";
import QRCode from 'qrcode';


export const signup = async (req, res) => {

    const { firstName, lastName, gender, dob, contact, email, password } = req.body;

    try {
        if (await User.findOne({ email: email }).exec()) {

            res.send("Already Existed!");
            // return res.status(200).json({ "message": false, error: "User already exists." });
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("alyan", salt);
            console.log("hased:", hashedPassword)

            await User.create({
                firstName,
                lastName,
                gender,
                dob,
                contact,
                email,
                password,
                resetToken: null,
                expires: null

            }).then((data) => {
                const token = jwt.sign(
                    { email: data.email, id: data._id },
                    config.get('SECRET'),
                    { expiresIn: "10h" }
                );
                res.send({ "message": true, "token": token, "user": data._id, success: "Account Created." })
                //res.status(200).json({ "message": true, token, success: "Account Created." });
            })
                .catch((err) => {
                    res.send(err.message);
                })

        }
    } catch (error) {
        res.send({ "error found:": error.message })
        // res.status(404).json({ message: error.message });
    }


}

export const editUser = async (req, res) => {

    const { firstName, lastName, gender, dob, contact, email, password } = req.body;
    const id = req.params.uid;

    console.log("last:", lastName);
    try {
        await User.findByIdAndUpdate({ _id: id }, { firstName, lastName, gender, dob, contact, email, password })
            .then((data) => {
                res.send({ success: "User Updated.", "user": data })
            })
            .catch((err) => {
                res.send({ message: "User not found" })
            })

    } catch (error) {
        res.send({ "error found:": error.message })
        // res.status(404).json({ message: error.message });
    }
}
export const deleteUser = async (req, res) => {

    // const { id } = req.body;
    const uid = req.params.uid;
    try {
        await User.findOneAndDelete({ _id: uid })
            .then((data) => {
                res.send("User Deleted");
            })
            .catch((err) => {

                res.send(err.message)
            })
    }
    catch (error) {

        res.send({ "error": error.message })
    }
}
export const login = async (req, res) => {

    const { email, password } = req.body;

    try {
        if (email == "" && password == "") {
            res.send("none")
            //res.status(201).json({ "message": "none" });

        } else if (await User.findOne({ email, password: password }).exec()) {
            User.find({ email: email, password: password }, function (err, docs) {
                jwt.sign(
                    { id: docs[0].id },
                    config.get('jwtSecretKey'),
                    { expiresIn: "1h" },
                    (err, token) => {
                        try {
                            res.send({ "message": true, "token": token, "user": docs[0] })
                            //res.status(201).json({ "message": true, "token": token, "user": docs[0] });

                        } catch (error) {
                            res.send(error.message)
                            //res.status(409).json({ message: error.message });
                        }
                    }
                )
            });

        }
        else {
            res.send("Invalid")
            //res.status(201).json({ "message": "false" });
        }
    }
    catch (error) {
        res.send(error.message);
        //res.status(409).json({ message: error.message });
    }
}




export const forgotPassword = async (req, res) => {


    const { email } = req.body;
    try {
        await User.findOne({ email: email })
            .then(users => {
                if (!users) {
                    console.log("Error");
                    return res.status(200).json({ 'message': false, error: "User dont exists with that email" })
                }
                const randomCode =Math.floor(Math.random() * 10000);
                console.log("email:", config.get('USER'), "password", config.get('PASS'))
                var transporter = nodemailer.createTransport({
                    // service: 'gmail',//smtp.gmail.com  //in place of service use host...


                    host: 'smtp.gmail.com',
                    port: 587,
                    auth: {
                        user: config.get('USER'),
                        pass: config.get('PASS'),
                    },

                });


                var currentDateTime = new Date();
                var mailOptions = {
                    from: 'no-reply@gmail.com',
                    to: users.email,
                    subject: "Reset password link",

                    html: `<h2>You requested for password reset </h2><p>\
              You are requested to copy the code below and enter it to the redirected page.<br/>\
              <h2> ${randomCode}</h2><br/>\
             This code will expire within 1 hour.<br/>\
              </p>`
                };

                transporter.sendMail(mailOptions, async function (error, info) {
                    if (error) {
                        console.log("not sent: ", error);
                    } else {

                        const token = jwt.sign(
                            { id: users._id },
                            "reset",
                            { expiresIn: "1h" }
                        )

                        const expire = Date.now() + 3600000;
                        const { _id, firstName, lastName, gender, dob, contact, email, password, resetToken, expires } = users;
                        const a = await User.findByIdAndUpdate(_id, { _id, firstName, lastName, gender, dob, contact, email, password, resetToken: token, expires: expire }, { new: true });

                        console.log("a= ", a.expires);
                        return res.send("Check your email");
                        //return res.status(200).json({ 'message': true, success: "Check your email" })

                    }
                });
                // console.log("message")
            })
    } catch (error) {
        // console.log("err in catch=", error);
        return res.send(error.message);
        //return res.status(404).json({ message: error.message });
    }
}


export const resetPassword = async (req, res) => {

    const { email, password } = req.body;
    try {

        let users = await User.findOne({ email: email, expires: { $gt: Date.now() } })

        if (!users) {
            return res.status(200).json({ "message": false, error: "Try again sesssion expired!" });
        } else {

            console.log("user= ", users.email);
            console.log("before:", users.password);

            // const salt = await bcrypt.genSalt(10);
            // const hashedPassword = await bcrypt.hash(pass, salt);
            const { _id, firstName, lastName, gender, dob, contact, email, password, resetToken, expires } = users;
            console.log("expires= ", expires);
            const a = await User.findByIdAndUpdate(_id, { _id, firstName, lastName, gender, dob, contact, email, password: pass, resetToken: null, expires: null }, { new: true });

            res.send("Password Changed");
            return res.status(200).json({ "message": true, success: "Password Chanegd!\n Sign in to Continue." });
        }


    } catch (error) {
        res.send(err);
        // return res.status(200).json({ message: error.message });
    }


}

export const newMenu = async (req, res) => {

    const { resturantName, address, city, contact, name, items } = req.body;

    const uid = req.params.uid;

    try {
        const result = await Menu.create({
            resturantName,
            address,
            city,
            contact,
            name,
            items,
            user: uid,
            qrcode: ""

        })
            .then(async (data) => {
                var qrData = {};
                const url = "https://google.com/";
                qrData.resturantName = data.resturantName;
                qrData.address = data.address;
                qrData.city = data.city;
                qrData.name = data.name;
                qrData.contact = data.contact
                qrData.items = data.items;
                qrData.text = url;

                let stringdata = JSON.stringify(qrData);
                console.log("stringData:  ", stringdata);
                var path = './qrcodes/menu/' + data._id + '.png';
                QRCode.toFile(path, url,
                    function (err, QRcode) {
                        if (err) return console.log(err.message)
                    })

                const opts = {
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    color: {
                        dark: '#208698',
                        light: '#FFF',
                    },
                }
                QRCode.toString(stringdata, opts,
                    function (err, QRcode) {

                        if (err) return console.log(err.message)

                        // console.log("type:",typeof(QRcode));
                        // // Printing the generated code
                        console.log(QRcode)
                    })



                await QRCode.toDataURL(stringdata, opts)
                    .then((code) => {
                        console.log("type of base64:", typeof (code));

                        Menu.findByIdAndUpdate({ _id: data._id }, { qrcode: code })
                            .then((obj) => {
                                console.log(obj);
                            })
                            .catch((err) => {
                                res.send(err.message)
                            })

                    })
                    .catch((err) => {
                        res.send(err.message)
                    })
                res.send("Menu Created!")
            })
            .catch((err) => {
                res.send(err.message)
            })

    }
    catch (error) {

        res.status(409).json({
            message: error.message
        });
    }
}

export const editMenu = async (req, res) => {

    const { resturantName, address, city, contact, name, items, user } = req.body;
    const mid = req.params.mid;

    try {
        await Menu.findByIdAndUpdate({ _id: mid }, { _id: mid, resturantName, address, city, contact, name, items, user })
            .then((data) => {
                res.send({ message: "Menu Updated!", menu: data })
            })
            .catch((err) => {
                res.send(err.message)
            })

    }
    catch (error) {

        res.status(409).json({
            message: error.message
        });
    }
}

export const deleteMenu = async (req, res) => {

    const mid = req.params.mid;
    try {
        await Menu.findOneAndDelete({ _id: mid })
            .then((data) => {
                res.send("Menu Successfully Deleted");
            })
            .catch((err) => {
                res.send(err.message)
            })
    }
    catch (error) {

    }
}

export const getUserMenus = async (req, res) => {

    const uid = req.params.uid;
    await Menu.find({ user: uid })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.send(err.message)
        })
}

export const getMenu = async (req, res) => {

    const mid = req.params.mid;
    await Menu.find({ _id: mid })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.send(err.message)
        })
}

export const newSurvey = async (req, res) => {

    const user = req.params.uid;
    const { name, address, city, description, image } = req.body;

    try {
        await Survey.create({ name, address, city, description, image, user })
            .then( async (data) => {
                var qrData = {};
                const url = "https://www.youtube.com/watch?v=5Eqb_-j3FDA";
                qrData.address = data.address;
                qrData.city = data.city;
                qrData.name = data.name;
                qrData.image= data.image;
                qrData.text = url;

                let stringdata = JSON.stringify(qrData);
                var path = './qrcodes/surveys/' + data._id + '.png';
                QRCode.toFile(path, url,
                    function (err, QRcode) {
                        if (err) return console.log(err.message)
                    })

                const opts = {
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    color: {
                        dark: '#208698',
                        light: '#FFF',
                    },
                }
                QRCode.toString(stringdata, opts,
                    function (err, QRcode) {

                        if (err) return console.log(err.message)
                        // console.log("type:",typeof(QRcode));
                        // // Printing the generated code
                        console.log(QRcode)
                    })

                await QRCode.toDataURL(stringdata, opts)
                    .then((code) => {
                        console.log("type of base64:", typeof (code));
                        Survey.findByIdAndUpdate({ _id: data._id }, { qrcode: code })
                            .then((obj) => {
                                console.log(obj);
                            })
                            .catch((err) => {
                                res.send(err.message)
                            })

                    })
                    .catch((err) => {
                        res.send(err.message)
                    })
                res.send({ message: "Survey Created!", "survey": data })
            })
            .catch((err) => {
                res.send(err.message)
            })

    }
    catch (error) {

        res.status(409).json({
            message: error.message
        });
    }
}

export const editSurvey = async (req, res) => {

    const sid = req.params.sid;
    const { name, address, city, description, image } = req.body;

    try {
        await Survey.findByIdAndUpdate({ _id: sid }, { _id: sid, name, address, city, description, image }).then((data) => {
            res.send("Survey Updated!")
        })
            .catch((err) => {
                res.send(err.message)
            })

    }
    catch (error) {

        res.status(409).json({
            message: error.message
        });
    }
}

export const deleteSurvey = async (req, res) => {

    const sid = req.params.sid;
    try {
        await Survey.findOneAndDelete({ _id: sid })
            .then((data) => {
                res.send("Survey Successfully Deleted");
            })
            .catch((err) => {

                res.send(err.message)
            })
    }
    catch (error) {

    }
}


export const getUserSurveys = async (req, res) => {

    const uid = req.params.uid;
    await Survey.find({ user: uid })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.send(err.message)
        })
}

export const getSurvey = async (req, res) => {

    const sid = req.params.sid;
    await Survey.find({ _id: sid })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.send(err.message)
        })
}