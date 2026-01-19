package com.apicollab.platform.common;

import java.util.Random;

public class PhraseGenerator {

    private static final String[] ADJECTIVES = {
        "big", "blue", "cool", "fast", "good", "green", "hard", "kind", "long", "loud",
        "new", "nice", "open", "pink", "real", "red", "safe", "soft", "tall", "tiny",
        "warm", "wise"
    };

    private static final String[] NOUNS = {
        "ant", "bear", "bird", "boat", "book", "cake", "cat", "door", "duck", "fish",
        "goat", "hat", "home", "king", "kite", "lion", "moon", "park", "rain", "road",
        "ship", "song", "star", "sun", "tree", "wolf"
    };

    private static final Random RANDOM = new Random();

    public static String generate() {
        String adj = ADJECTIVES[RANDOM.nextInt(ADJECTIVES.length)];
        String noun = NOUNS[RANDOM.nextInt(NOUNS.length)];
        return adj + noun;
    }
}
