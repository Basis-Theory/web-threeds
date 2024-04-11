MAKEFLAGS += --silent

verify:
	./scripts/verify.sh

build:
	./scripts/build.sh

upload-bundle:
	./scripts/uploadbundle.sh

release:
	yarn release

get-version:
	yarn release --dry-run --no-ci | grep -i 'The next release version is' | awk '{print $NF}' > .VERSION && cp .VERSION dist/
