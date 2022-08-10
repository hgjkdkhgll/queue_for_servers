const express = require('express');
const app = express();
const axios = require('axios');
var queue = require('queue');

var qc1 = queue({ results: [] })
var qc2 = queue({ results: [] })
var qo1 = queue({ results: [] })
var qo2 = queue({ results: [] })
let catalog1 = "localhost:6000";
let catalog2 = "localhost:6001";
let order1 = "localhost:6100";
let order2 = "localhost:6101";
app.post('/category/:id', (req) => {
    if (req.params.id == "1") {
        qc1.push(req.body);
    } else if (req.params.id == "2") {
        qc2.push(req.body);
    }
});
app.post('/order/:id', (req) => {
    if (req.params.id == "1") {
        qo1.push(req.body);
    } else if (req.params.id == "2") {
        qo2.push(req.body);
    }
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});
//node js send post request every 5 seconds 

setInterval(() => {
    if (qc1.length > 0) {
        let data = qc1.pop();
        axios.post('http://' + catalog1 + '/api/sync', data).then((res) => {
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
                    axios.post('http://' + catalog2 + '/api/sync', data).then((res) => {
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
                                axios.post('http://' + order1 + '/api/sync', data).then((res) => {
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
                                            axios.post('http://' + order2 + '/api/sync', data).then((res) => {
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
}, 5000);
