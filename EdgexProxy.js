var mqtt = require('mqtt');
var CORS = require('cors')();
var async = require('async');
var express = require('express');
var bodyParser = require('body-parser');
var requestToServer = require('request');
var bodyGenerator = require('./domain/BodyGenerator');
var edgexProxy = express();

edgexProxy.use(CORS);
edgexProxy.use(bodyParser.json());
edgexProxy.use(bodyParser.urlencoded({extended: false}));

var mqtt_client = mqtt.connect('mqtt://10.211.55.21:1883');

var registerSensoredValueFromEdgeX = function (reading, callBackResponse) {

    var sensrod_value = reading ['value'];
    var sensrod_value_name = reading ['name'];

    var targetURL = "http://203.253.128.161:7579/Mobius/edgex_test/" + sensrod_value_name;

    console.log(targetURL)

    var bodyObject = bodyGenerator.contentInstanceBodyGeneratorForJSON(sensrod_value);

    requestToServer({
        url: targetURL,
        method: 'POST',
        json: true,
        headers: { // Basic AE resource structure for registration
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'Origin',
            'Content-type': 'application/json; ty=4'
        },
        body: bodyObject
    }, function (error, oneM2MResponse, body) {
        if(typeof(oneM2MResponse) !== 'undefined') {
            // if (oneM2MResponse.statusCode == 201) {
            //     console.log("Updated")
            // } else if (oneM2MResponse.statusCode == 404) {
            //     console.log("Error")
            // }
            callBackResponse(oneM2MResponse.statusCode);
        }
    });
};

mqtt_client.on('message', function (topic, message) {
    // message is Buffer

    var rcvMessage = message.toString()
    var rcvMessage = JSON.parse(rcvMessage)

    var readings = rcvMessage['readings']
    var iterationCount = 0;

    async.whilst(
        function() {
            return iterationCount < readings.length
        },

        function (async_for_loop_callback) {

            var reading = readings[iterationCount];

            console.log(reading);

            registerSensoredValueFromEdgeX(reading, function (statusCode) {
                if(statusCode == 201) {
                    iterationCount++;
                    console.log("201, Data has been updated");
                    async_for_loop_callback (null, iterationCount);
                } else if (statusCode == 404) {
                    iterationCount++;
                    console.log("404, Not found error has occurred");
                } else {
                    console.log("This condition is going to be covered later");
                }
            });
        }
    );
});

mqtt_client.on('connect', function () {
    mqtt_client.subscribe('EdgeXDataTopic', function (err) {
        if (!err) {
            console.log("EdgeX Proxy is subscribing the EdgeX")
        }
    })
});

edgexProxy.listen(62577, function () {
    console.log('Server running at http://localhost:62577');
});