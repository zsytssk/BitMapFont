<?xml version="1.0"?>
<font>
  <info face="微软雅黑" size="{{fontSize}}" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="1" aa="1" padding="0,0,0,0" spacing="{{spacing}},{{spacing}}" outline="0"/>
  <common lineHeight="{{fontSize}}" base="26" scaleW="{{width}}" scaleH="{{height}}" pages="1" packed="0" alphaChnl="1" redChnl="0" greenChnl="0" blueChnl="0"/>
  <pages>
    <page id="0" file="{{fileName}}.png" />
  </pages>
  <chars count="{{items.length}}">{{each items}}
      <char id="{{$value.id}}" x="{{$value.x}}" y="{{$value.y}}" width="{{$value.width - spacing}}" height="{{$value.height - spacing}}" xoffset="0" yoffset="0" xadvance="{{$value.width - spacing}}" page="0" chnl="15" />{{/each}}
  </chars>
</font>