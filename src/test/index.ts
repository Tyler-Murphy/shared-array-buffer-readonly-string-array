import test from 'parallel-test'
import * as assert from 'assert'
import SharedArrayBufferReadonlyStringArray from '../index.js'
import {
	Worker,
} from 'worker_threads'
import * as path from 'path'

test(`Contains the same data that was passed in`, () => {
	const inputData: ConstructorParameters<typeof SharedArrayBufferReadonlyStringArray>[0] = [
		`abc`,
		`a longer string`,
		`striñg with speciàl characters: Ꭳ‗‰⁔₴ℒↈ⇘⊞⏚⛄🭨ЌΫǄƆ\u0016⻆👨‍👩‍👧‍👦`.normalize(`NFC`),
		`striñg with speciàl characters: Ꭳ‗‰⁔₴ℒↈ⇘⊞⏚⛄🭨ЌΫǄƆ\u0016⻆👨‍👩‍👧‍👦`.normalize(`NFD`),
		``,
		``,
		`\n\n`,
	]

	const sharedStrings = new SharedArrayBufferReadonlyStringArray(inputData)

	assert.deepStrictEqual(
		inputData,
		Array.from(sharedStrings),
	)
})

test(`Works for empty arrays`, () => {
	assert.doesNotThrow(() => new SharedArrayBufferReadonlyStringArray([]))
})

test(`Works for single-element arrays`, () => {
	const inputData: ConstructorParameters<typeof SharedArrayBufferReadonlyStringArray>[0] = [
		`abc`,
	]

	const sharedStrings = new SharedArrayBufferReadonlyStringArray(inputData)

	assert.deepStrictEqual(
		inputData,
		Array.from(sharedStrings),
	)
})

test(`Can transfer from thread to thread`, async () => {
	const inputData: ConstructorParameters<typeof SharedArrayBufferReadonlyStringArray>[0] = Array(10)
	.fill(null)
	.map(() => Math.random().toString())

	const sharedStrings = new SharedArrayBufferReadonlyStringArray(inputData)

	const workerThread = new Worker(path.join(path.dirname(new URL(import.meta.url).pathname), `identityWorker.js`))

	workerThread.unref() // alternative to explicit `terminate` later, to allow the process to exit
	workerThread.postMessage(sharedStrings)

	const response = await new Promise((resolve, reject) => {
		workerThread.once(`error`, reject)
		workerThread.once(`messageerror`, reject)
		workerThread.once(`message`, resolve)
	})

	assert.deepStrictEqual(
		Array.from(SharedArrayBufferReadonlyStringArray.fromWorkerThreadMessageData(response)),
		inputData,
	)
})

test(`Worker threads have the same data`, async () => {
	const inputData: ConstructorParameters<typeof SharedArrayBufferReadonlyStringArray>[0] = Array(10)
	.fill(null)
	.map(() => Math.random().toString())

	const sharedStrings = new SharedArrayBufferReadonlyStringArray(inputData)

	const workerThread = new Worker(path.join(path.dirname(new URL(import.meta.url).pathname), `concatenateWorker.js`))

	workerThread.unref() // alternative to explicit `terminate` later, to allow the process to exit
	workerThread.postMessage(sharedStrings)

	const response = await new Promise((resolve, reject) => {
		workerThread.once(`error`, reject)
		workerThread.once(`messageerror`, reject)
		workerThread.once(`message`, resolve)
	})

	assert.deepStrictEqual(
		response,
		inputData.join(``),
	)
})
