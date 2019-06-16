
.PHONY: install clean

install: Makefile package.json gruntfile.js
	npm install

clean:
	rm -rf node_modules

