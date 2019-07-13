###  INPUT & OUTPUT  ##########################################################

MD       := $(wildcard *.md)
HTML     := $(patsubst %.md, %.html, $(MD))

###  TEMPLATE CONFIG  #########################################################

OS       := $(shell uname -s)
REVEAL   := ./revealSlides
MACROS   := $(REVEAL)/slide-build/macros.m4
TEMPLATE := $(REVEAL)/slide-build/template.html
FILTER   := $(REVEAL)/slide-build/pandoc-filter/$(OS)
NODE     := $(REVEAL)/node_modules

###  EXPLICIT RULES  ##########################################################

.PHONY: html server clean 

html: Makefile $(HTML)

Makefile: $(REVEAL)/slide-build/Makefile
	@\cp -f $(REVEAL)/slide-build/Makefile .
	$(warning Local Makefile updated from $(REVEAL)/slide-build/. Please re-run make.)

$(NODE):
	@cd $(REVEAL) && make

server: html $(NODE)
	@$(NODE)/grunt-cli/bin/grunt --gruntfile $(REVEAL)/gruntfile.js -b $(REVEAL)/ --root=`pwd`

$(HTML): $(SRC) $(TEMPLATE) $(MACROS)

clean:
	rm -f $(HTML)

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

