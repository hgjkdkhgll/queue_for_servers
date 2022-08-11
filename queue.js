const express = require('express');
const app = express();
const axios = require('axios');
var queue = require('queue');

var qc1 = queue({ results: [] })
var qc2 = queue({ results: [] })
var qo1 = queue({ results: [] })
var qo2 = queue({ results: [] })
let catalog1 = "localhost:15000";
let catalog2 = "localhost:15000";
let order1 = "localhost:6100";
let order2 = "localhost:6100";
app.post('/catalog/:id', (req,res) => {
    if (req.params.id == "1") {
        qc1.push(req.body);
        console.log("catalog1");
    } else if (req.params.id == "2") {
        qc2.push(req.body);
        console.log("catalog2");
    }
    hit();
    res.sendStatus(200);
});
app.post('/order/:id', (req,res) => {
    if (req.params.id == "1") {
        qo1.push(req.body);
        console.log("order1");

    } else if (req.params.id == "2") {
        qo2.push(req.body);
        console.log("order2");
    }
    hit();
    res.sendStatus(200);
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});


async function hit(){
    console.log("hit");
    console.log(qc1.length);
    console.log(qc2.length);
    console.log(qo1.length);
    console.log(qo2.length);
    if (qc1.length > 0) {
        let data = qc1.pop();
        axios.post('http://' + catalog2 + '/api/Books', data).then((res) => {
            if (res.status == 200) {
                console.log("success");
            } else {
                throw new Error("error");
            }
        }).catch((err) => {
            qc1.push(data);
            console.log(err.response?.data);
        })
            .then(() => {
                if (qc2.length > 0) {
                    let data = qc2.pop();
                    axios.post('http://' + catalog1 + '/api/Books', data).then((res) => {
                        if (res.status == 200) {
                            console.log("success");
                        } else {
                            throw new Error("error");
                        }
                    }).catch((err) => {
                        qc2.push(data);
                        console.log(err.response?.data);
                    })
                        .then(() => {
                            if (qo1.length > 0) {
                                let data = qo1.pop();
                                axios.post('http://' + order2 + '/api/sync', data).then((res) => {
                                    if (res.status == 200) {
                                        console.log("success");
                                    } else {
                                        throw new Error("error");
                                    }
                                }).catch((err) => {
                                    qo1.push(data);
                                    console.log(err.response?.data);
                                })
                                    .then(() => {
                                        if (qo2.length > 0) {
                                            let data = qo2.pop();
                                            axios.post('http://' + order1 + '/api/sync', data).then((res) => {
                                                if (res.status == 200) {
                                                    console.log("success");
                                                } else {
                                                    throw new Error("error");
                                                }
                                            }).catch((err) => {
                                                qo2.push(data);
                                                console.log(err.response?.data);
                                            });
                                        }
                                    });
                            }
                        });
                }
            });
    }
}
