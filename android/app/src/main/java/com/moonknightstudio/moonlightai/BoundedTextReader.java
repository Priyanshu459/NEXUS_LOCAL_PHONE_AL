package com.moonknightstudio.moonlightai;

import java.io.ByteArrayOutputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;

/** Enforces the limit on actual bytes, including files with missing/false metadata. */
public final class BoundedTextReader {
    public static final int MAX_BYTES = 512 * 1024;

    private BoundedTextReader() {}

    public static String read(InputStream input) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int total = 0;
        while (true) {
            // Read at most one byte beyond the limit to distinguish an exact-size file.
            int count = input.read(buffer, 0, Math.min(buffer.length, MAX_BYTES - total + 1));
            if (count == -1) break;
            total += count;
            if (total > MAX_BYTES) {
                throw new IOException("This file exceeds the 512 KB text attachment limit.");
            }
            bytes.write(buffer, 0, count);
        }
        String text = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new StringReader(text))) {
            for (int i = 0; i < 2000; i++) {
                String line = reader.readLine();
                if (line == null) break;
                output.append(line.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "")).append('\n');
            }
        }
        return output.toString();
    }
}
