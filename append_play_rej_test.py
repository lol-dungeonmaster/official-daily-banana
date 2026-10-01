import re

with open('tests/audio-player.test.js', 'r') as f:
    lines = f.readlines()

# find the last "});"
idx = len(lines) - 1
while idx >= 0:
    if lines[idx].strip() == "});":
        break
    idx -= 1

if idx >= 0:
    lines = lines[:idx]
    
lines.append("""
  it('handles playback failure gracefully', async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve([ { title: "Track 1", file: "t1.mp3", space_url: "s1" } ])
    });

    vi.useFakeTimers();
    initAudioPlayer(mockWindow, mockDocument);
    await vi.runAllTimersAsync();
    
    const playBtn = mockDocument.querySelector("a[title='Play']");
    const audioEl = mockDocument.getElementById('flow-audio-el');
    
    // Mock play to reject
    audioEl.play.mockRejectedValueOnce(new Error('Autoplay blocked'));
    Object.defineProperty(audioEl, 'paused', { value: true, configurable: true });
    
    playBtn.click();
    await vi.runAllTimersAsync();
    
    expect(consoleErrorMock).toHaveBeenCalledWith("Playback failed:", expect.any(Error));
    vi.useRealTimers();
  });
});
""")

with open('tests/audio-player.test.js', 'w') as f:
    f.writelines(lines)
