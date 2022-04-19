const bench = require('@stdlib/bench')
const Hyperdrive = require('hyperdrive')
const Hypercore10 = require('hypercore')
const Hyperbee = require('hyperbee')
const Hyperblobs = require('hyperblobs')
const { once } = require('events')
const { promisify } = require('util')
const Hyperblobbee = require('../old-index')
const Hyperblobbee2 = require('../index')
const tempy = require('tempy')
const del = require('del')

function cleanup(dir) {
  return del(dir, { force: true }).catch((e) =>
    console.log('Error deleting directory', e)
  )
}

function toMb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + 'MB'
}

module.exports = (fileSize) => {
  bench(`Hyperblobee: Write ${toMb(fileSize)} file`, async (b) => {
    // setup
    const dir = tempy.directory()
    const core = new Hypercore10(dir)
    const db = new Hyperbee(core)
    const blobs = new Hyperblobbee(db)
    await db.ready()
    const buf = Buffer.alloc(fileSize).fill('abcdefg')

    // task
    b.tic()
    for (let j = 0; j < b.iterations; j++) {
      await blobs.put('foo' + j, buf)
    }
    b.toc()
    await core.close()
    await cleanup(dir)
    b.end()
  })

  bench(`Hyperblobee2: Write ${toMb(fileSize)} file`, async (b) => {
    // setup
    const dir = tempy.directory()
    const core = new Hypercore10(dir)
    const core2 = new Hypercore10(dir + 'index')
    const db = new Hyperbee(core2, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    })
    const blobs = new Hyperblobbee2({
      core,
      db
    })
    await db.ready()
    const buf = Buffer.alloc(fileSize).fill('abcdefg')

    // task
    b.tic()
    for (let j = 0; j < b.iterations; j++) {
      await blobs.put('foo' + j, buf)
    }
    b.toc()
    await core.close()
    await core2.close()
    await cleanup(dir)
    await cleanup(dir + 'index')
    b.end()
  })

  bench(`Hyperblobs: Write ${toMb(fileSize)} file`, async (b) => {
    // setup
    const dir = tempy.directory()
    const core = new Hypercore10(dir)
    // Use same default block size as hyperblobbee (512KB)
    const blobs = new Hyperblobs(core, { blockSize: 1024 * 512 })
    await core.ready()
    const buf = Buffer.alloc(fileSize).fill('abcdefg')

    // task
    b.tic()
    for (let j = 0; j < b.iterations; j++) {
      await blobs.put(buf)
    }
    b.toc()
    await core.close()
    await cleanup(dir)
    b.end()
  })

  bench(`Hyperdrive: Write ${toMb(fileSize)} file`, async (b) => {
    // setup
    const dir = tempy.directory()
    const drive = new Hyperdrive(dir)
    const buf = Buffer.alloc(fileSize).fill('abcdefg')
    await once(drive, 'ready')

    // task
    b.tic()
    for (let j = 0; j < b.iterations; j++) {
      await promisify(drive.writeFile).call(drive, 'foo' + j, buf)
    }
    b.toc()
    await promisify(drive.close).call(drive)
    await cleanup(dir)
    b.end()
  })
}
