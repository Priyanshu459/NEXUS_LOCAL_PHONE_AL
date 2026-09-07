import com.moonknightstudio.moonlightai.BoundedTextReader;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/** Local JVM tests; no Android device, network, or huge allocations required. */
public class AttachmentSecurityTest {
    private static void check(boolean ok, String message) {
        if (!ok) throw new AssertionError(message);
    }

    public static void main(String[] args) throws Exception {
        byte[] longLine = new byte[2 * 1024 * 1024];
        Arrays.fill(longLine, (byte) 'A');
        // Reproduction of the original readLine-before-limit algorithm.
        BufferedReader legacy = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(longLine), StandardCharsets.UTF_8));
        int characters = 0;
        StringBuilder original = new StringBuilder();
        String line;
        while ((line = legacy.readLine()) != null && characters < BoundedTextReader.MAX_BYTES) {
            original.append(line).append('\n');
            characters += line.length() + 1;
        }
        check(original.length() > BoundedTextReader.MAX_BYTES, "Original limit bypass did not reproduce");
        System.out.println("Original algorithm accepted " + original.length() + " characters from a single oversized line.");

        for (byte[] payload : new byte[][] {longLine, "é".repeat(300000).getBytes(StandardCharsets.UTF_8)}) {
            ByteArrayInputStream stream = new ByteArrayInputStream(payload);
            try {
                BoundedTextReader.read(stream);
                throw new AssertionError("Oversized input accepted");
            } catch (IOException expected) {
                check(payload.length - stream.available() == BoundedTextReader.MAX_BYTES + 1, "Read past the byte limit");
            }
        }
        byte[] exact = Arrays.copyOf(longLine, BoundedTextReader.MAX_BYTES);
        check(BoundedTextReader.read(new ByteArrayInputStream(exact)).length() == exact.length + 1, "Exact limit rejected");
        check(BoundedTextReader.read(new ByteArrayInputStream(new byte[0])).isEmpty(), "Empty file failed");
        String clean = BoundedTextReader.read(new ByteArrayInputStream("hello\u0000\nworld".getBytes(StandardCharsets.UTF_8)));
        check(clean.equals("hello\nworld\n"), "Text sanitization changed");
        String lines = BoundedTextReader.read(new ByteArrayInputStream("x\n".repeat(2100).getBytes(StandardCharsets.UTF_8)));
        check(lines.equals("x\n".repeat(2000)), "Line limit changed");
        System.out.println("PASS: oversized ASCII, oversized UTF-8, exact limit, empty file, control characters, line limit.");
    }
}
