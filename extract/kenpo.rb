# frozen_string_literal: true
require "json"
base = File.read("./kenpo.txt")

space = "　"

kenpos = []
state = :root
current = nil
next_caption = nil
base.split("\n\n").each do |section|
  if section == "前文"
    state = :article
    current = { title: section, caption: "", text: "" }
    next
  elsif section.match("〔(.+)〕")
    next_caption = $1
    next
  elsif section.match(/^第[一二三四五六七八九十百千零〇]+章/)
    state = :chapter
  elsif section.match(/^(第[一二三四五六七八九十百千零〇]+条)#{space}(.+)/)
    state = :article
    if current
      kenpos << current
    end
    current = { title: $1, caption: next_caption || "", text: $2.strip }
  elsif state == :article
    current[:text] += "\n" + section.strip
    current[:text].strip!
  end
end
kenpos << current if current

File.open("./kenpo.json", "w") do |f|
  f.write(JSON.pretty_generate(kenpos))
end
