const log4js = require('log4js')
const logger = log4js.getLogger('tms-xlsx-etd')
const path = require('path')
const fs = require('fs')

class MongoError extends Error {
  constructor(msg) {
    super(msg)
  }
}

class EtdError extends Error {
  constructor(msg) {
    super(msg)
  }
}
/**
 * mongodb配置
 */
class MongoConfig {}
MongoConfig.connect = function(host, port, database) {
  const mongoose = require('mongoose')
  const url = `mongodb://${host}:${port}/${database}`

  mongoose.connection.on('error', function(err) {
    const msg = `mongodb操作错误：${err.message}`
    logger.error(msg, err)
    throw new MongoError(msg)
  })

  return mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      logger.info(`连接'${url}'成功`)
      return mongoose
    })
    .catch(err => {
      const msg = `连接'${url}'失败：${err.message}`
      logger.error(msg, err)
      return Promise.reject(new MongoError(msg))
    })
}
MongoConfig.ins = (function() {
  let instance
  return async function() {
    if (instance) return instance
    const filename = path.resolve('config/mongodb.js')
    if (!fs.existsSync(filename)) {
      const msg = `配置文件${filename}不存在`
      logger.error(msg)
      return new MongoError(msg)
    }

    const { host, port, database } = require(filename)

    if (typeof host !== 'string') {
      let msg = '没有指定mongodb的主机地址'
      logger.error(msg)
      throw new MongoError(msg)
    }
    if (typeof port !== 'number') {
      let msg = '没有指定mongodb连接的端口'
      logger.error(msg)
      throw new MongoError(msg)
    }
    if (typeof database !== 'string') {
      let msg = '没有指定mongodb连接的数据库'
      logger.error(msg)
      throw new MongoError(msg)
    }

    const mongoose = await MongoConfig.connect(host, port, database)

    logger.info(`加载配置文件'${filename}'成功`)

    return (instance = Object.assign(new MongoConfig(), {
      host,
      port,
      database,
      mongoose
    }))
  }
})()

/**
 * ETD配置
 */
class EtdConfig {}
EtdConfig.ins = (function() {
  let instance
  return function() {
    if (instance) return instance

    const filename = path.resolve('config/etd.js')
    if (!fs.existsSync(filename)) {
      const msg = `配置文件${filename}不存在`
      logger.error(msg)
      throw new EtdError(msg)
    }
    instance = new EtdConfig()
    const { columns} = require(filename)

    Object.assign(instance, { columns})

    logger.info(`加载配置文件'${filename}'成功`)

    return instance
  }
})()

class Context {
  constructor(mongoose) {
    this.mongoose = mongoose
    this.models = new Map()
  }
  static close() {
    return Context.mongoose()
      .connection.close()
      .then(() => {
        _instance = null
        return true
      })
  }
  static async mongoose() {
    const ins = await Context.ins()
    return ins.mongoose
  }

	// insert 
	static async ModelInsert_asterisk(){
		const ins = await Context.ins();
		return ins.models.get('sip_asterisk')
	}

	static async ModelInsert_osips(){
		const ins = await Context.ins();
		return ins.models.get('sip_osips')
	}
}

Context.ins = (function() {
  let instance
  return async function() {
    if (instance) return Promise.resolve(instance)

    const { mongoose } = await MongoConfig.ins()

    instance = new Context(mongoose)

    Context.createModels(instance)

    return Promise.resolve(instance)
  }
})()

Context.init = Context.ins
Context.createModels = function(instance) {
  const mongoose = instance.mongoose
  const Schema = mongoose.Schema

  const { columns } = EtdConfig.ins()
  const fields = { path: String }
  columns.forEach(col => {
    fields[col.name] = col.type
  })
  let collections = ['sip_asterisk', 'sip_osips']

  // 创建和collection对应的model
  collections.forEach(name => {
    const schema = new Schema(fields, {
      collection: name
    })
    let Model = mongoose.model(name, schema)

    instance.models.set(name, Model)
  })
}

module.exports = { Context, EtdConfig}
