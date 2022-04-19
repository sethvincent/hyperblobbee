const Hyperblobs = require('hyperblobs')

const DEFAULT_BLOCK_SIZE = 1024 * 512 // 512KB
const DEFAULT_BUFFER_SIZE = 1024 * 1024 * 10 // 10MB

module.exports = class Hyperblobbee {
	constructor (options = {}) {
		this.blockSize = options.blockSize || DEFAULT_BLOCK_SIZE
    this.bufferSize = options.bufferSize || DEFAULT_BUFFER_SIZE

		this.blobs = new Hyperblobs(options.core, {
			blockSize: this.blockSize
		})

		this.index = options.db
	}

	async put (key, blob, opts = {}) {
		const id = await this.blobs.put(blob, opts)
		await this.index.put(key, id)
	}

	async get (key, opts = {}) {
		const id = await this.index.get(key)
		return this.blobs.get(id.value)
	}

	createReadStream (key, opts = {}) {

	}

	createWriteStream (key, opts = {}) {

	}
}
