# Install

```sh
npm i shared-array-buffer-readonly-string-array
```

# Use

## Example

For an example of how to create and share an array among threads, see the tests in [`./src/test/index.ts`](./src/test/index.ts).

## Api

See [`./src/index.ts`](./src/index.ts), which has Typescript types.

You can:
  - Make a new shareable, readonly array by prividing an array of strings.
  - Iterate over it starting at the beginning
  - Transfer it to other threads via `postMessage`
  - Access an existing shared array with `fromWorkerThreadMessageData`

You can't (currently):
  - Get its length
  - Access values at a particular index
  - Iterate starting from different positions
  - Iterate in reverse
