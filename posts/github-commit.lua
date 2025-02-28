
function load_cache()
    local f = io.open("cache.json", "r")
    if f == nil then
        f = io.open("cache.json", "w")
        assert(f)
        f:write("{}")
        f:close()
        f = io.open("cache.json", "r")
        assert(f)
    end
    local result = quarto.json.decode(f:read("*a"))
    f:close()
    return result
end

function write_cache(cache)
    local f = io.open("cache.json", "w")
    assert(f)
    f:write(quarto.json.encode(cache))
    f:close()
end

function add_to_cache(cache, key, value)
    cache[key] = value
    write_cache(cache)
end

function curl(url)
    local f = io.popen("curl '" .. url .. "'")
    assert(f)
    local s = f:read("*a")
    f:close()
    return s
end

function commit_retriever(hash)
    local html = curl("https://github.com/search?q=hash%3A" .. hash .. "&type=Commits")
    local m = html:match("%<a data%-pjax[^>]* href=\"([^\"]+)\"%>")
    return "https://github.com" .. m
end

function get_from_cache_maybe(cache, key, retriever)
    local result = cache[key]
    if result then
        return result
    end
    result = retriever(key)
    add_to_cache(cache, key, result)
    return result
end

local cache = load_cache()

function Span(span)   
    if span.classes:includes("github-commit") then
        local hash = span.attr.attributes["hash"]
        local url = get_from_cache_maybe(cache, hash, commit_retriever)
        local code = pandoc.Code(hash:sub(1, 7))
        local link = pandoc.Link(pandoc.Inlines({code}), url)
        return link
    end
end