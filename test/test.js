var SFTPWatcher = require('../');

var Watcher = new SFTPWatcher({
	host: 'localhost',
	port: 22,
	user: 'root',
	password: '',
});
Watcher.interval = 3000;
Watcher.debug = true;
Watcher.start();
