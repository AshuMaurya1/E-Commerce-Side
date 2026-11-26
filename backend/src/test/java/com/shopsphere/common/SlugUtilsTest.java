package com.shopsphere.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class SlugUtilsTest {

    @Test
    void returnsItemForNullInput() {
        assertEquals("item", SlugUtils.toSlug(null));
    }

    @Test
    void returnsItemForBlankInput() {
        assertEquals("item", SlugUtils.toSlug("   "));
    }

    @Test
    void convertsNameToLowercaseHyphenatedSlug() {
        assertEquals("modern-wireless-headphones", SlugUtils.toSlug("  Modern Wireless Headphones  "));
    }

    @Test
    void removesDiacriticsAndSpecialCharacters() {
        assertEquals("cafe-au-lait", SlugUtils.toSlug("Café au lait!"));
    }

    @Test
    void fallsBackToItemWhenNoAsciiCharactersRemain() {
        assertEquals("item", SlugUtils.toSlug("東京"));
    }
}
