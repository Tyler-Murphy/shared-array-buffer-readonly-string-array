import test from 'parallel-test'
import * as assert from 'assert'
import semver from 'semver'
import {
	readPackage,
} from 'read-pkg'

test(`there is a node version in package.json`, async () => {
	const packageJson = await readPackage()

	assert.ok(packageJson.engines)
	assert.ok(packageJson.engines.node)

	const parsedSemver = semver.coerce(packageJson.engines.node)

	assert.ok(parsedSemver, `Found a valid node version in package.json`)
	assert.ok(semver.valid(parsedSemver))
})

test(`current node version is allowed by package.json node version`, async () => {
	const packageJson = await readPackage()

	assert.ok(semver.clean(process.version), `Found a valid process.version`)
	assert.ok(semver.satisfies(
		semver.clean(process.version) as string,
		packageJson.engines?.node ?? `no version found`,
	))
})
