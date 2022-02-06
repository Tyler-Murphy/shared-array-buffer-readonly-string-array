import {
	parentPort,
} from 'worker_threads'
import SharedArrayBufferReadonlyStringArray from '../index.js'

if (parentPort != null) {
	parentPort.once(`message`, (message: unknown) => {
		const sharedStrings = SharedArrayBufferReadonlyStringArray.fromWorkerThreadMessageData(message)

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		parentPort!.postMessage(Array.from(sharedStrings).join(``))
	})
}
