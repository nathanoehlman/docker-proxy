var os = require('os');
var cp = require('child_process');
var Proxim = require('proxim');
var proxies = {};
var reTokenize = /[\s]{2,}/g;
var refreshInterval = 5000;
var ip = process.env.DOCKER_HOST && process.env.DOCKER_HOST.split('/')[2].split(':')[0];
if (!ip) return console.error('No DOCKER_HOST environment variable detected. Docker is probably not running') && process.exit(1);
console.log('Docker running on %s', ip);

var proxim = Proxim();

function setupProxy(portMapping) {
	if (!portMapping) return;

	var listenPort = portMapping.split('->')[0].split(':')[1];
	if (!listenPort) return;
	if (!proxies[listenPort]) {
		var xim = proxim.from(listenPort).to({ host: ip, port: listenPort });
		console.log('Establishing proxy from %s to %s:%s', listenPort, ip, listenPort);
		proxies[listenPort] = {host: ip, port: listenPort, xim: xim};
		xim.on('listening', function(port, host) {
			console.log('Proxy established on %s:%s', host, port);
		});
		xim.on('proxy:established', function(socket, proxy, target) {
			console.log('Connection has been proxied to %s:%s', target.host, target.port);
		});
		xim.on('error', function(err, connection, target) {
			if (target) {
				console.log('Error proxying from %s to %s:%s [%s]', listenPort, target.host, target.port, err.message || err);
			} else {
				console.log('Error proxying from %s [%s]', listenPort, err.message || err);
			}
		});
	}
}

function refresh(callback) {
	cp.exec('docker ps', function(err, stdout, stderr) {
		if (err) return callback && callback(err);

		var lines = stdout.split(os.EOL);
		var headings = lines[0].replace(reTokenize, '|').split('|');
		var entries = lines.splice(1).map(function(line) {
			var entry = {};
			line.replace(reTokenize, '|').split('|').forEach(function(val, idx) {
				return entry[headings[idx]] = val;
			});
			return entry;
		});

		entries.forEach(function(entry) {
			if (!entry.PORTS) return;
			entry.PORTS.split(',').map(setupProxy);
		});

		setTimeout(refresh, refreshInterval);
		return callback && callback();
	});
}

refresh(function(err) {
	if (err) {
		console.error('Docker does not appear to be running', err);
	}
});
