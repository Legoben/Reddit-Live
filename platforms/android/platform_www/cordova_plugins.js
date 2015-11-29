cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-whitelist/whitelist.js",
        "id": "cordova-plugin-whitelist.whitelist",
        "pluginId": "cordova-plugin-whitelist",
        "runs": true
    },
    {
        "file": "plugins/com.ququplay.websocket.WebSocket/www/phonegap-websocket.js",
        "id": "com.ququplay.websocket.WebSocket.websocket",
        "pluginId": "com.ququplay.websocket.WebSocket",
        "clobbers": [
            "WebSocket"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.2.0",
    "com.ququplay.websocket.WebSocket": "0.1.0"
}
// BOTTOM OF METADATA
});