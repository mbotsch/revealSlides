###  INPUT & OUTPUT  ##########################################################

MD       := $(wildcard *.md)
HTML     := $(patsubst %.md, %.html, $(MD))

###  TEMPLATE CONFIG  #########################################################

OS       := $(shell uname -s)
REVEAL   := ./revealSlides
MACROS   := $(REVEAL)/slide-build/macros.m4
TEMPLATE := $(REVEAL)/slide-build/template.html
FILTER   := $(REVEAL)/slide-build/pandoc-filter/$(OS)

###  EXPLICIT RULES  ##########################################################

.PHONY: html setup server clean allclean

html: Makefile $(HTML)

setup: Makefile package.json gruntfile.js
	@npm install

Makefile: $(REVEAL)/slide-build/Makefile
	@\cp $(REVEAL)/slide-build/Makefile .

package.json: $(REVEAL)/slide-build/package.json
	@\cp $(REVEAL)/slide-build/package.json .

gruntfile.js: $(REVEAL)/slide-build/gruntfile.js
	@\cp $(REVEAL)/slide-build/gruntfile.js .

server: setup html
	@npm start

$(HTML): $(SRC) $(TEMPLATE) $(MACROS)

clean:
	rm -f $(HTML)

allclean:
	rm -rf $(HTML) package.json gruntfile.js node_modules


###  IMPLICIT RULES  ##########################################################


%.html: %.md
	m4 $(MACROS) $< | \
	pandoc \
	--from markdown+emoji+smart \
	--to revealjs \
	--no-highlight \
	--mathjax \
	--filter $(FILTER)/cols \
	--filter $(FILTER)/media \
	--template $(TEMPLATE) \
	--variable template=$(REVEAL) \
	-o $@

