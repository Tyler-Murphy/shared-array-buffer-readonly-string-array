type WorkerThreadTransferFormat = {
	indexView: InstanceType<typeof indexViewType>,
	dataView: InstanceType<typeof dataViewType>,
}

const indexViewType = Uint32Array
const dataViewType = Uint8Array
const maximumBufferSize = 2 ** (indexViewType.BYTES_PER_ELEMENT * 4)

export default class SharedArrayBufferReadonlyStringArray implements WorkerThreadTransferFormat {
	indexView: InstanceType<typeof indexViewType>
	dataView: InstanceType<typeof dataViewType>

	static isWorkerThreadMessageData(data: unknown): data is WorkerThreadTransferFormat {
		return (
			hasProperty(data, `indexView`)
			&&
			hasProperty(data, `dataView`)
			&&
			data.indexView instanceof indexViewType
			&&
			data.dataView instanceof dataViewType
			&&
			data.indexView.buffer === data.dataView.buffer
			&&
			data.indexView.byteOffset === 0
			&&
			data.dataView.byteOffset === data.indexView.byteLength
			&&
			data.indexView.byteLength + data.dataView.byteLength === data.indexView.buffer.byteLength
		)
	}

	static fromWorkerThreadMessageData(data: unknown): InstanceType<typeof SharedArrayBufferReadonlyStringArray> {
		if (!SharedArrayBufferReadonlyStringArray.isWorkerThreadMessageData(data)) {
			throw new TypeError(`Argument must pass the 'isWorkerThreadMessageData' check`)
		}

		return new SharedArrayBufferReadonlyStringArray(data)
	}

	/**
	 * `WorkerThreaadTransferFormat` can be retrieved by calling `valueOf` on an instance of the class. To re-make the instance in another worker thread, just pass it to this constructor.
	 *
	 * References:
	 *   - https://nodejs.org/api/worker_threads.html#portpostmessagevalue-transferlist
	 */
	constructor(data: ReadonlyArray<string> | WorkerThreadTransferFormat) {
		if (SharedArrayBufferReadonlyStringArray.isWorkerThreadMessageData(data)) {
			this.indexView = data.indexView
			this.dataView = data.dataView

			return
		}

		// Figure out how many bytes the buffer needs to be
		const requiredIndexSize = data.length * indexViewType.BYTES_PER_ELEMENT
		const requiredDataSize = data.reduce((cumulativeSize, string) => cumulativeSize + Buffer.byteLength(string, `utf8`), 0) * dataViewType.BYTES_PER_ELEMENT
		const requiredBufferSize = requiredIndexSize + requiredDataSize

		if (requiredBufferSize > maximumBufferSize) {
			throw new RangeError(`Bytes required (${requiredBufferSize.toLocaleString()}) exceeds maximum allowed bytes (${maximumBufferSize.toLocaleString()})`)
		}

		// Make the buffer and views of its index and data
		const buffer = new SharedArrayBuffer(requiredBufferSize)

		this.indexView = new indexViewType(
			buffer,
			0,
			data.length
		)
		this.dataView = new dataViewType(
			buffer,
			this.indexView.byteLength,
			requiredDataSize
		)

		// Fill the buffer
		let currentDataIndex = 0

		for (const [
			index,
			string,
		] of data.entries()) {
			this.indexView[index] = currentDataIndex

			const stringBytes = Buffer.from(string, `utf8`)

			this.dataView.set(stringBytes, currentDataIndex)
			currentDataIndex += stringBytes.byteLength
		}
	}

	* [Symbol.iterator](): Iterator<string> {
		for (const [
			indexIndex,
			dataIndex,
		] of this.indexView.entries()) {
			const nextDataIndex = this.indexView[indexIndex + 1]

			yield Buffer.from(this.dataView.slice(dataIndex, nextDataIndex)).toString(`utf8`)
		}
	}

	get workerThreadMessageData(): WorkerThreadTransferFormat {
		return {
			indexView: this.indexView,
			dataView: this.dataView,
		}
	}
}

function hasProperty<P extends PropertyKey>(thing: unknown, property: P): thing is object & Record<P, unknown> {
	return (
		thing != null
		&&
		typeof thing === `object`
		&&
		property in thing
	)
}
