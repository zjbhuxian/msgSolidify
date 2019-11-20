const fs = require('fs');
const log4js = require('log4js');
const redis = require('redis');
const {sipFormat_ast, sipFormat_osips} = require('../model/sipformat.js')
const {Context: EtdContext, EtdConfig } = require('../model/index')
	
class Solidify {
	/**
	 * Get configure
	 */
	constructor(){
	}

	fsConfigByFile(){
		let fsConfigPath = process.cwd() + '/config/redis.js';
		if(!fs.existsSync(fsConfigPath)){
			logger.warn(`Config file (${fsConfigPath} NOT EXISTS)`);
			return false;
		}
		let fsConfig  = require(fsConfigPath);
		return fsConfig;
	};

	/**
	 * Init
	 */
	async fsInit(fsConfig){
		if(typeof fsConfig.host !== 'string' || !fsConfig.host || fsConfig.host.length === 0){
			return false;
		}
		if(typeof fsConfig.port !== 'string' || !fsConfig.port || fsConfig.port.length === 0){
			return false;
		}
		if(typeof fsConfig.channel !== 'object' || Object.prototype.toString.call(fsConfig.channel) != '[object Array]' || fsConfig.channel.length === 0){
			return false;
		}
	}

	columns() {
		const columns = EtdConfig.ins().columns;
		console.log(columns);
	}

	static async storeToDB(json, model){
		if(!json || !model){
			console.log("Invalid parameter in storeToDB.");
		}

		model.insertMany(json, (err, res) => {
			if(err){
				console.log("Failed to insert: "+err);
			}
			console.log("Successed to insert.");
		})
	}


	/**
	 * Startup
	 */
	async startup(){
		const m_osips = await EtdContext.ModelInsert_osips();
		const m_aster = await EtdContext.ModelInsert_asterisk();
		/**
		 * Start redis subscribing
		 */
		let fsConfig = this.fsConfigByFile();
		if(fsConfig)this.fsInit(fsConfig)

		let rc = redis.createClient(fsConfig.port, fsConfig.host);
		rc.on("ready", function(){
			fsConfig.channel.forEach(function(ch){
				rc.subscribe(ch);
			})
		});
		
		rc.on("error", function(error){
			console.log("Error: "+error);
		});

		rc.on("subscribe", function(channel, count){
			console.log("Subscribed from "+channel+","+count+"message");
		});

		rc.on("message", function(channel, message){
			let formatedMsg;
			let model;
			if(channel == "OSIPS"){
				console.log("OSIPS message...")
				formatedMsg = sipFormat_osips(message);
				model = m_osips;
			}else{
				console.log("ASTER message...")
				formatedMsg = sipFormat_ast(message);
				model = m_aster;
			}
			Solidify.storeToDB(formatedMsg, model);
		});

		rc.on("unsubscribe", function(channel, message){
			console.log("Unsubscribe");
		});
	}
};

module.exports = {
	Solidify
}
