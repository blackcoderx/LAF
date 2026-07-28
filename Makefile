CXX = g++
CXXFLAGS = -std=c++17 -O2 -static-libgcc -static-libstdc++
SRC = src/main.cpp
OUT = laf-server

all: $(OUT)

$(OUT): $(SRC)
	$(CXX) $(CXXFLAGS) -o $(OUT) $(SRC)

clean:
	rm -f $(OUT)
