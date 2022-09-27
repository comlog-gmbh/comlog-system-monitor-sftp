var Client = require('ssh2').Client;

function ComlogSFTPWatcher(options) {
	require('comlog-event-handler')(this);

	var	_self = this;
	this.satus = null; // null = start, true = off, false = on
	this.debug = false;
	this.interval = 60000; // 1 Minute

	this.logger = console;

	// Private funktionen
	var _running = false, _timer = null;
	if (!options) options = {};
	options.host = options.host || options.name || 'localhost';
	options.port = options.port || 22;
	options.username = options.username || options.user || 'anonymous';
	options.password = options.password || options.pass || 'anonymous@';

	// Extracting local options
	for(var i in options) {
		if (typeof this[i] != 'undefined') {
			this[i] = options[i];
			delete options[i];
		}
	}

	function _watch() {
		if (_running) return;
		_running = true;

		var c = new Client();

		var __event = function(err) {
			if (err !== null) {
				if (_self.debug) _self.logger.error(err.stack || err);
				_self.emit('error', [new Error("Connection to \""+options.user+'@'+options.host+"\" filed \n"+err.message)]);
				if (_self.satus === true) _self.emit('down');
				_self.satus = false;

				_running = false;
				_timer = setTimeout(_watch, _self.interval);
			}
			else {
				c.sftp(function(err2, sftp) {
					if (err2 !== null && typeof err2 != "undefined") {
						if (_self.debug) _self.logger.error(err2.stack || err2);
						_self.emit('error', [new Error("Connection to \""+options.user+'@'+options.host+"\" filed \n"+err2.message)]);
						if (_self.satus === true) _self.emit('down');
						_self.satus = false;

						_running = false;
						_timer = setTimeout(_watch, _self.interval);
					}
					else {
						sftp.readdir('.', function(err3, list) {
							if (err3 !== null && typeof err2 != "undefined") {
								if (_self.debug) _self.logger.error(err3.stack || err2);
								_self.emit('error', [new Error("Connection to \""+options.user+'@'+options.host+"\" filed \n"+err3.message)]);
								if (_self.satus === true) _self.emit('down');
								_self.satus = false;

								_running = false;
								_timer = setTimeout(_watch, _self.interval);
							}
							else {
								var new_status = true, msg = "Connection to \""+options.user+'@'+options.host+"\" check ok \n";

								// check result
								if (_self.debug) _self.logger.info(msg);
								if (_self.satus !== null && _self.satus !== new_status) _self.emit(new_status ? 'up' : 'down');
								_self.satus = new_status;

								c.end();

								_running = false;
								_timer = setTimeout(_watch, _self.interval);
							}
						});
					}
				});
			}
		};

		var ready_or_error_send = false;
		c.on('ready', function() {
			ready_or_error_send = true;
			console.info('Ready!');
			__event(null);
		});
		c.on('error', function(err) {
			ready_or_error_send = true;
			console.info('Error!');
			__event(err);
		});
		c.on('close', function() {
			if (!ready_or_error_send) __event(new Error("Ready or Error event not send!"));
			console.info('Close!');
		});
		c.connect(options);
	}

	/**
	 * Überwachung starten
	 */
	this.start = function() {
		_watch();
	};

	/**
	 * Überwachung stoppen
	 */
	this.stop = function() {
		if (_timer !== null) clearInterval(_timer);
	};

	for(var i in options) this[i] = options[i];
}

module.exports = ComlogSFTPWatcher;
