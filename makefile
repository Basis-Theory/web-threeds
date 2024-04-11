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
	./scripts/getversion.sh
