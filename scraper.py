import urllib.request
import re
import base64
import time

urls = { '1771': 'tt0458339', '1726': 'tt0371746', '10138': 'tt1228705', '10195': 'tt0800369', '24428': 'tt0848228', '68721': 'tt1300854', '76338': 'tt1981115', '100402': 'tt1843866', '118340': 'tt2015381', '283995': 'tt3896198', '99861': 'tt2395427', '102899': 'tt0478970', '271110': 'tt3498820', '284053': 'tt1228705', '497698': 'tt3480822', '284054': 'tt1825683', '315635': 'tt2250912', '363088': 'tt5095030', '299537': 'tt4154664', '338953': 'tt3501632', '299536': 'tt4154756', '299534': 'tt4154796' } # First batch of Marvel movies

with open('data.js', 'r', encoding='utf-8') as f:
    text = f.read()

count = 0
for tmdb, imdb in urls.items():
    if f'"tmdbId": {tmdb}' in text and '"posterBase64"' not in text.split(f'"tmdbId": {tmdb}')[1].split("}")[0]:
        try:
            req = urllib.request.Request(f'https://www.imdb.com/title/{imdb}/', headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            })
            with urllib.request.urlopen(req) as resp:
                html = resp.read().decode('utf-8')
                
                match = re.search(r'\"image\":\"(https://m\.media-amazon\.com/images/M/[^\"]+\.jpg)\"', html)
                if not match:
                    match = re.search(r'meta property=\"og:image\" content=\"(https://m\.media-amazon\.com/images/M/[^\"]+\.jpg)\"', html)
                
                if match:
                    img_url = match.group(1)
                    req2 = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req2) as resp2:
                        b64 = base64.b64encode(resp2.read()).decode('utf-8')
                        
                        text = re.sub(
                            f'("tmdbId": {tmdb},[\\s\\S]*?"posterCss": "[^"]+")(\\s*}})',
                            f'\\1,\n                "posterBase64": "data:image/jpeg;base64,{b64}"\\2',
                            text
                        )
                        count += 1
                        print(f'Done {tmdb}')
                else:
                    print(f'No poster match for {tmdb}')
        except Exception as e:
            print(f'Error {tmdb}: {e}')
        time.sleep(0.5)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(text)
print(f'Done injected {count} base64 images')
