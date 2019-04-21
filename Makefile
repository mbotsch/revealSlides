###  INPUT & OUTPUT  ##########################################################

MD       := $(wildcard *.md)
HTML     := $(patsubst %.md, %.html, $(MD))

###  TEMPLATE CONFIG  #########################################################

OS       := $(shell uname -s)
REVEAL   := ./revealSlides
MACROS   := $(REVEAL)/macros.m4
TEMPLATE := $(REVEAL)/template.html
FILTER   := $(REVEAL)/pandoc-filter/$(OS)

###  EXPLICIT RULES  ##########################################################

.PHONY: html

html: $(HTML)

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

