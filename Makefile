PANDOC_MIN_VERSION=2.6

.PHONY: install clean check_pandoc_version

check_pandoc_version:
	@test $(shell (pandoc -v | head -n 1 | cut -d " " -f2 ;\
	               echo $(PANDOC_MIN_VERSION)\
	              ) | sort -V | head -n 1)\
	              = $(PANDOC_MIN_VERSION)\
	              || (echo "Your pandoc installation is too old, minimum version $(PANDOC_MIN_VERSION)"; exit 1)


install: Makefile package.json gruntfile.js check_pandoc_version

	npm install

clean:
	rm -rf node_modules

