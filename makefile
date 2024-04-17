MAKEFLAGS += --silent

verify:
	./scripts/verify.sh

build:
	./scripts/build.sh

upload-bundle:
	./scripts/uploadbundle.sh

release:
	yarn release

update-version:
	./scripts/updateversion.sh