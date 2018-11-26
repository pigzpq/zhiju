<?xml version="1.0" encoding="UTF-8"?>
<es:EventSubscribers xmlns:es="http://www.kingdee.com/bos/event/model/es">
  <es:EventSubscribePoints>
    <es:EventSubscribePoint>
      <es:Id>espId</es:Id>
      <es:Name>espName</es:Name>
      <es:Destination>webservice#http#pull#async</es:Destination>
    </es:EventSubscribePoint>
  </es:EventSubscribePoints>
  <es:EventSubscribePointRelations>
    <es:EventSubscribePointRelation>
      <es:Id>espRelId</es:Id>
      <es:Description>desc</es:Description>
      <es:RefEventId>51710238-239a-4b4f-a825-a4e59b133aa0</es:RefEventId>
      <es:RefEventName>com.kingdee.eas.cp.arcm.app.DocDispatch.submitEvent</es:RefEventName>
      <es:RefSubscribePointId>espId</es:RefSubscribePointId>
      <es:RefSubscribePointType></es:RefSubscribePointType>
    </es:EventSubscribePointRelation>
  </es:EventSubscribePointRelations>
</es:EventSubscribers>