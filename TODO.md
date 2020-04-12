# TODOs

## Support Image Mirroring

At the moment if you are unlucky you could convert a page that links everthing in a markdown unfriendly way. Also for all Media besides the text you will need the internet
I think this is solvable with a wget pass, I found a partial solution already on github:

```shell
#!/bin/sh
  wget -e robots=off \
    -H -nd -nc -np \
    --recursive -p \
    --level=1 \
    --accept jpg,jpeg,png,gif \
    --convert-links -N \
    --limit-rate=200k \
    --wait 1.0 \
    -P $target_folder $stripped_url \
    -U 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.1.6) Gecko/20070802 SeaMonkey/1.1.4'
done
```

This might be a good start if combined with my User Agent Database.

The challenge here is to transform either the HTML or the Markdown Document to point to the new local files instead of pointing online.
Also this breaks Windows Support. Sorry guys, but this should work fine with WSL...
