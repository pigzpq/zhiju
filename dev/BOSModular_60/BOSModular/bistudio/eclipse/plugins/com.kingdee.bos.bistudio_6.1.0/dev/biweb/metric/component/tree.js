/////////////////////////////////////////////
// 横向树控件   Along 090916
/////////////////////////////////////////////

//********************
//*  树控件的数据模型
//********************
function HorizontalTreeModel(root)
{
	var _root = root;
	var _properties = new Array();//Map，属性集合
	
	this.getRoot = function()
	{
		return _root;
	}
	
	this.getProperty = function(key)
	{
		return _properties[key];
	}

	this.setProperty = function(key, value)
	{
		_properties[key] = value;
	}
}

//**************************
//*  树控件一个节点的数据模
//**************************
function HorizontalTreeNode()
{
	var _value;//Object
	var _children = new Array();//Node的集合，子节点
	var _isWithBeanpodChildren;//boolean，是否挂着纵向子
	var _relations = new Array();//Object的集合，子节点间关系
	var _parent;//Node，父节点
	var _extProperties = new Array();//Map，扩展属性
	var _isAllowsExpand = false;//boolean，是否允许展开操作
	var _isExpanded = false;//boolean，是否为展开状态
	
	this.getValue = function()
	{
		return _value;
	}

	this.setValue = function(value)
	{
		_value = value;
	}

	this.isLeaf = function()
	{
		return this.getChildCount() == 0;
	}

	this.getChildCount = function()
	{
		return _children.length;
	}

	this.getChild = function(idx)
	{
		return _children[idx];
	}

	this.addChild = function(child)
	{
		_children.push(child);
		child.setParent(this);
	}
	
//	function removeChild(child)
//	{
//		//TODO
//	}
	
	this.getChildrenRelation = function(idx)
	{
		if(idx < _relations.length)
		{
			return _relations[idx];
		}
		return null;
	}

	this.setChildrenRelation = function(idx, relation)
	{
		_relations[idx] = relation;
	}

	this.getParent = function()
	{
		return _parent;
	}

	this.setParent = function(parent)
	{
		_parent = parent;
	}

	this.getExtProperty = function(key)
	{
		return _extProperties[key];
	}

	this.setExtProperty = function(key, value)
	{
		_extProperties[key] = value;
	}

	this.isWithBeanpodChildren = function()
	{
		//必须所有子节点都是叶子才可以
		if(_isWithBeanpodChildren)
		{
			var isChildrenLeaf = true; 
			for(var i = this.getChildCount() - 1; isChildrenLeaf && i >= 0; i--)
			{
				isChildrenLeaf = isChildrenLeaf && this.getChild(i).isLeaf();
			}
			return isChildrenLeaf;
		}
		return false;
	}
	
	this.setWithBeanpodChildren = function(isWithBeanpodChildren)
	{
		_isWithBeanpodChildren = isWithBeanpodChildren;
	}

	this.isAllowsExpand = function()
	{
		return _isAllowsExpand;
	}

	this.setAllowsExpand = function(isAllows)
	{
		_isAllowsExpand = isAllows;
	}
	
	this.isExpanded = function()
	{
		return _isExpanded;
	}
	
	this.setExpanded = function(isExpanded)
	{
		_isExpanded = isExpanded;
	}
}

//*********************
//*  描述位置的类
//*********************
function Position(x, y)
{
	var _x = x;
	var _y = y;
	
	this.getX = function()
	{
		return _x;
	}
	
	this.setX = function(x)
	{
		_x = x;
	}
	
	this.getY = function()
	{
		return _y;
	}
	
	this.setY = function(y)
	{
		_y = y;
	}
	
	this.toString = function()
	{
		return _x + "," + _y;
	}
}

//*********************
//*  描述大小的类
//*********************
function Dimension(width, height)
{
	var _width = width;
	var _height = height;
	
	this.getWidth = function()
	{
		return _width;
	}
	
	this.setWidth = function(w)
	{
		_width = w;
	}
	
	this.getHeight = function()
	{
		return _height;
	}
	
	this.setHeight = function(h)
	{
		_height = h; 
	}
	
	this.toString = function()
	{
		return _width + "," + _height;
	}
}

//*********************
//*  x,y,w,h
//*********************
function Rectangle(x, y, width, height)
{
	Position.call(this, x, y);
	Dimension.call(this, width, height);
	
	this.toString = function()
	{
		return this.getX() + "," + this.getY() + "," + this.getWidth() + "," + this.getHeight();
	}
}

//*********************
//*  一层的边界
//*********************
function Edge(left, right)
{
	var _left = left;
	var _right = right;
	
	var _negativeMovable = 0;
	var _positiveMovable = 0;
		
	this.copy = function()
	{
		var result = new Edge(this.getLeft(), this.getRight());
		result.setNegativeMovable(this.getNegativeMovable());
		result.setPositiveMovable(this.getPositiveMovable());
		return result;
	}
	
	this.getLeft = function()
	{
		return _left;
	}
	
	this.getRight = function()
	{
		return _right;
	}
	
	this.getMiddle = function()
	{
		return _left + (_right - _left) / 2;
	}
	
	this.getWidth = function()
	{
		return _right - _left;
	}
		
	this.move = function(delta)
	{
		_left += delta;
		_right += delta;
	}

	//父节点接头到最左节点接头的水平距离，即该层可向右移的极值
	this.getPositiveMovable = function()
	{
		return _positiveMovable;
	}
	
	//父节点接头到最左节点接头的水平距离，即该层可向右移的极值
	this.setPositiveMovable = function(positiveMovable)
	{
		_positiveMovable = positiveMovable;
	}
	
	//父节点接头到最右节点接头的水平距离，即该层可向左移的极值
	this.getNegativeMovable = function()
	{
		return _negativeMovable;
	}
	
	//父节点接头到最右节点接头的水平距离，即该层可向左移的极值
	this.setNegativeMovable = function(negativeMovable)
	{
		_negativeMovable = negativeMovable;
	}
		
	//整个another在this右边，则返回正数，不重叠；
	//否则返回负数，为重叠量。
	//(不考虑整个another在this左边的情况)
	this.getSuperposition = function(another)
	{
		return another.getLeft() - _right;
	}
		
	this.toString = function()
	{
		//for test
		return "(" + _left + "," + _right + ")";
	}

	//[静态方法] Edge a + Edge b，调用者须确保a或b至少有一个非空
	Edge.prototype.merge = function(a, b) 
	{
		var left1 = 32767, right1 = -32768;
		var nm1 = 32767, pm1 = 32767;
		if(a)
		{
			left1 = a.getLeft();
			right1 = a.getRight();
			nm1 = a.getNegativeMovable();
			pm1 = a.getPositiveMovable();
		}
		var left2 = 32767, right2 = -32768;
		var nm2 = 32767, pm2 = 32767;
		if(b)
		{
			left2 = b.getLeft();
			right2 = b.getRight();
			nm2 = b.getNegativeMovable();
			pm2 = b.getPositiveMovable();
		}
		var result = new Edge(Math.min(left1, left2), Math.max(right1, right2));
		result.setNegativeMovable(Math.min(nm1, nm2));
		result.setPositiveMovable(Math.min(pm1, pm2));
		return result;
	}
}

//*********************
//*  一个分支的各层边界
//*********************
function Edges()
{
	var _listEdges = new Array();//Eage的集合
	var _isUnlimited;//boolean，无限长，有纵向子的标志

	this.copy = function()
	{
		var result = new Edges();
		result.setUnlimited(this.isUnlimited());
		for(var i = 0; i < this.physicalDepth(); i++)
		{
			result.add(this.get(i).copy());
		}
		return result;
	}
		
	//当前边界集尝试合并到它的左兄弟的边界中，这个过程会修改当前的边界值。
	//@param x,Edges，左兄弟分支的边界集
	//@param siblingGap,int，亲兄弟节点的水平间距
	//@param sousinGap,int，表兄弟节点的水平间距
	//@return 修改边界值时的实际移动量，用于更新后代的位置
	this.tryMergeTo = function(x, siblingGap, sousinGap)
	{
		//第一层，并到左兄弟的第一层的右边。
		var tryLeft = x.get(0).getRight() + siblingGap;
		//则该分支的边界应该整体移动这么多：
		var tryMoving = tryLeft - this.get(0).getLeft();
		this.move(tryMoving);
		//移动后各层可能重叠，找出重叠最多的。
		var minSuperposition = 0;//负数的最小，即是重叠最多
		for(var i = 1; i < x.logicDepth(); i++)
		{
			if(i >= this.physicalDepth())
			{
				if(this.isUnlimited())
				{
					if(i >= x.physicalDepth())
					{
						break;
					}
				}
				else
				{
					break;
				}
			}
			var a = x.get(i);
			var b = this.get(i);
			var superposition = a.getSuperposition(b) - sousinGap;
			if(minSuperposition > superposition)
			{
				minSuperposition = superposition;
			}
		}
		//把重叠最多的调整到不重叠，则整体不重叠。
		if(minSuperposition < 0)
		{
			minSuperposition = -minSuperposition;
			this.move(minSuperposition);
		}
		return tryMoving + minSuperposition;
	}
		
	//所有层次边界移动指定值
	this.move = function(delta)
	{
		for(var i = 0; i < this.physicalDepth(); i++)
		{
			this.get(i).move(delta);
		}
	}

	//添加一层边界，加在后面		
	this.add = function(edge)
	{
		_listEdges.push(edge);
	}
	
	//添加一层边界，插在前面
	this.insert = function(edge)
	{
		_listEdges.unshift(edge);
	}
		
	//取得指定层的边界
	//当无限长时，无限的部分取的是物理层的最后一层
	this.get = function(idx)
	{
		if(this.isUnlimited() && idx >= this.physicalDepth())
		{
			return _listEdges[this.physicalDepth() - 1];
		}
		return _listEdges[idx];
	}

	//数据模型物理层数，纵向子(如果有)只算一层
	this.physicalDepth = function()
	{
		return _listEdges.length;
	}
		
	//逻辑层数，如果有纵向子算无穷多层，否则等同于物理层数
	this.logicDepth = function()
	{
		if(this.isUnlimited())
		{
			return 32767;
		}
		else
		{
			return this.physicalDepth();
		}
	}
		
	//当有纵向子时设置为true
	this.setUnlimited = function(isUnlimited)
	{
		_isUnlimited = isUnlimited;
	}
		
	//如果有纵向子，认为无限长
	this.isUnlimited = function()
	{
		return _isUnlimited;
	}

	this.toString = function()
	{
		//for test
		var sb = "{";
		for(var i = 0; i < _listEdges.length; i++)
		{
			sb += this.get(i).toString();
		}
		if(this.isUnlimited())
		{
			sb += "~";
		}
		sb += "}";
		return sb;
	}
	
	//[静态方法] 二个兄弟分支的边界集合并，得到新的实例——合并体的边界集
	//@param x,y Edges
	Edges.prototype.merge = function(x, y)
	{
		var result = new Edges();
		result.setUnlimited(x.isUnlimited() || y.isUnlimited());
		var depth = Math.max(x.logicDepth(), y.logicDepth());
		for(var i = 0; i < depth; i++)
		{
			if(i >= x.physicalDepth() && i >= y.physicalDepth())
			{
				if(x.physicalDepth() == y.physicalDepth())
				{
					if(x.isUnlimited() && !y.isUnlimited())
					{
						result.add(x.get(i).copy());
					}
					else if(!x.isUnlimited() && y.isUnlimited())
					{
						result.add(y.get(i).copy());
					}
				}
				break;
			}
			var a;
			if(x.isUnlimited())
			{
				a = x.get(i);
			}
			else
			{
				a = (i >= x.physicalDepth() ? null : x.get(i));
			}
			var b;
			if(y.isUnlimited())
			{
				b = y.get(i);
			}
			else
			{
				b = (i >= y.physicalDepth() ? null : y.get(i));
			}
			
			var added = Edge.prototype.merge(a, b);
			result.add(added);
		}
		return result;
	}
}

//******************************************
//*  树控件主类：主要完成各节点位置的确定
//******************************************
function HorizontalTree(model)
{
	var _this = this;//供private方法用
	
	var KEY_EDGES = "system.horizontaltree.render.edges";
	var KEY_RECTANGLE = "system.horizontaltree.render.rectangle";
	
	var _model = model;//HorizontalTreeModel
	var _customView;//like DefaultHorizontalTreeView
	var _levelHeights = new Array();
	
	var _isDynamicLayout = true;//展开收缩时影响位置
	
	var _offsetX;//int
	var _offsetY;//int
	var _ui;//div
	
	this.setModel = function(model)
	{
		_model = model;
	}
	
	this.getModel = function()
	{
		return _model;
	}
	
	this.setCustomView = function(customView)
	{
		_customView = customView;
		_customView.setTree(this);
	}
	
	this.getCustomView = function()
	{
		if(_customView == null)
		{
			this.setCustomView(new DefaultHorizontalTreeView());
		}
		return _customView;
	}
	
	this.setDynamicLayout = function(isDynamicLayout)
	{
		_isDynamicLayout = isDynamicLayout;
	}
	
	//return Dimension
	var confirmNodesPosition = function(offsetX, offsetY)
	{
		offsetX += _this.getCustomView().getSiblingGap();//预留括号的位置
		
		var root = _this.getModel().getRoot();
		
		_levelHeights = confirmRelativePosition(root);
		var rootRect = root.getExtProperty(KEY_RECTANGLE);
		_levelHeights.unshift(rootRect.getHeight());
		
		var edges = root.getExtProperty(KEY_EDGES);
		
		//重心调整
		adjustBarycenter(root, edges);
		
		var minusPos = 0;
		var maxRight = 0;
		var minLeft = 65535;//对adjustBarycenter的补充
		for(var i = 0; i < edges.physicalDepth(); i++)
		{
			var edge = edges.get(i);
			if(minusPos > edge.getLeft())
			{
				minusPos = edge.getLeft();
			}
			if(maxRight < edge.getRight())
			{
				maxRight = edge.getRight();
			}
			if(minLeft > edge.getLeft())
			{
				minLeft = edge.getLeft();
			}
		}
		if(minusPos == 0 && minLeft != 65535)
		{
			minusPos = minLeft;
		}
		minusPos = -minusPos;
		maxRight += minusPos;//成为width
		//如果根节点确定后，有负的边界值（右分支从其左兄弟左下出界），要整体右移
		edges.move(minusPos);
		rootRect.setX(edges.get(0).getLeft() + offsetX);
		rootRect.setY(offsetY);
		var yEnd = updateChildrenPosition(root, 
			minusPos + offsetX, rootRect.getY(), 0, _levelHeights);
		
		if(yEnd < 0)//只有根节点时
		{
			yEnd = offsetY + rootRect.getHeight();
		}
		
		return (new Dimension(
			offsetX + maxRight + _this.getCustomView().getSiblingGap(), yEnd + 20));
	}
	
	//调整重心
	var adjustBarycenter = function(root, edges)
	{
		var middle = edges.get(0).getMiddle();
		for(var i = 1, c = edges.physicalDepth(); i < c; i++)
		{
			var edge = edges.get(i);
			if(edge.getNegativeMovable() == 0 && edge.getPositiveMovable() == 0)
			{
				//某层有纵向子，不再往下走
				break;
			}
			
			var leftMoment = middle - edge.getLeft();
			var rightMoment = edge.getRight() - middle;
			leftMoment = (leftMoment < 0 ? 0 : leftMoment);
			rightMoment = (rightMoment < 0 ? 0 : rightMoment);
			var wantMoveEdge = (leftMoment - rightMoment) / 2;//可正可负
			if(wantMoveEdge == 0)
			{
				continue;
			}
			
			if(wantMoveEdge < -edge.getNegativeMovable())
			{
				wantMoveEdge = -edge.getNegativeMovable();
			}
			else if(wantMoveEdge > edge.getPositiveMovable())
			{
				wantMoveEdge = edge.getPositiveMovable();
			}
			
			for(var j = i; j < c; j++)
			{
				var tempEdge = edges.get(j);
				tempEdge.move(wantMoveEdge);
				if(j == i)
				{
					tempEdge.setNegativeMovable(tempEdge.getNegativeMovable() + wantMoveEdge);
					tempEdge.setPositiveMovable(tempEdge.getPositiveMovable() - wantMoveEdge);
				}
			}
			movingEdgeFromAppointDeep(root, wantMoveEdge, i, 0);
		}
	}
	
	//递归，从指定层开始，移动后续所有层的所有节点的位置
	var movingEdgeFromAppointDeep = function(node, xMoving, startFromLevel, level)
	{
		if(level >= startFromLevel)
		{
			var edges = node.getExtProperty(KEY_EDGES);
			edges.move(xMoving);
		}
		if(!node.isLeaf() && !isAsLeaf(node))
		{
			level++;
			for(var i = 0, c = node.getChildCount() - 1; i <= c; i++)
			{
				var child = node.getChild(i);
				movingEdgeFromAppointDeep(child, xMoving, startFromLevel, level);
			}
		}
	}
	
	//递归，深度优先、后序
	//return 各层高度的集合
	var confirmRelativePosition = function(node)
	{
		var levelHeights = new Array();
		var dim = _this.getCustomView().calculateNodeSize(node);
		var width = dim.getWidth();
		var height = dim.getHeight();
		node.setExtProperty(KEY_EDGES, null);
		node.setExtProperty(KEY_RECTANGLE, new Rectangle(0, 0, width, height));
		if(node.isLeaf() || isAsLeaf(node))
		{
			var edges = new Edges();
			edges.add(new Edge(0, width));//即(0,0+width)
			node.setExtProperty(KEY_EDGES, edges);
		}
		else if(node.isWithBeanpodChildren())
		{
			var edges = new Edges();
			edges.add(new Edge(0, width));
			var maxWidth = confirmBeanpod(node);
			edges.add(new Edge(0, maxWidth));
			edges.setUnlimited(true);
			node.setExtProperty(KEY_EDGES, edges);
		}
		else
		{
			var lineLeft = 0;
			var lineRight = 0;
			var mergedEdges = null;
			var maxSonHeight = 0;
			var mergedDescendantLevelHeights = new Array();
			for(var i = 0, c = node.getChildCount() - 1; i <= c; i++)
			{
				var child = node.getChild(i);
				var descendantLevelHeights = confirmRelativePosition(child);
				mergedDescendantLevelHeights = mergeDescendantLevelHeights(
						mergedDescendantLevelHeights, descendantLevelHeights);
				
				var sonHeight = child.getExtProperty(KEY_RECTANGLE).getHeight();
				if(maxSonHeight < sonHeight)
				{
					maxSonHeight = sonHeight;
				}
				
				var edges = child.getExtProperty(KEY_EDGES);
				if(mergedEdges == null)
				{
					mergedEdges = edges.copy();
				}
				else
				{
					var moving = edges.tryMergeTo(mergedEdges, 
							_this.getCustomView().getSiblingGap(node.getChildrenRelation(i)), 
							_this.getCustomView().getCousinGap());
					mergedEdges = Edges.prototype.merge(mergedEdges, edges);
					if(moving != 0)
					{
						updateChildrenEdges(child, moving);
					}
				}
				
				if(i == 0)
				{
					var edge = edges.get(0);
					lineLeft = edge.getMiddle();
				}
				if(i == c)
				{
					var edge = edges.get(0);
					lineRight = edge.getMiddle();
				}
			}
			mergedDescendantLevelHeights.unshift(maxSonHeight);
			levelHeights = mergedDescendantLevelHeights;
			//此处简单认为父节点的宽度一定不超过后代体系的宽度,即x不为负。
			var halfLineLen = (lineRight - lineLeft) / 2;
			var middlePos = lineLeft + halfLineLen;
			var x = middlePos - width / 2;
			mergedEdges.insert(new Edge(x, x + width));
			
			var movable = parseInt(halfLineLen * 0.8);
			mergedEdges.get(1).setNegativeMovable(movable);
			mergedEdges.get(1).setPositiveMovable(movable);

			node.setExtProperty(KEY_EDGES, mergedEdges);
		}
		return levelHeights;
	}
	
	//确定纵向子，返回最大宽度
	var confirmBeanpod = function(vParent)
	{
		var childX = _this.getCustomView().getBeanpodBusWidth();
		var maxWidth = 0;
		for(var i = 0; i < vParent.getChildCount(); i++)
		{
			var vChild = vParent.getChild(i);
			var dim = _this.getCustomView().calculateNodeSize(vChild);
			var width = dim.getWidth();
			var height = dim.getHeight();
			var edges = new Edges();
			edges.add(new Edge(0, childX + width));
			vChild.setExtProperty(KEY_EDGES, edges);
			vChild.setExtProperty(KEY_RECTANGLE, new Rectangle(0, 0, width, height));
			if(maxWidth < width)
			{
				maxWidth = width;
			}
		}
		return maxWidth + childX;
	}
	
	//找出后代层高中的最大者，合并成新的实例
	//@param l1,l2 Array
	//@return Array
	var mergeDescendantLevelHeights = function(l1, l2)
	{
		var result = new Array();
		var size = Math.max(l1.length, l2.length);
		for(var i = 0; i < size; i++)
		{
			var h1 = (i < l1.length ? l1[i] : 0);
			var h2 = (i < l2.length ? l2[i] : 0);
			result.push(Math.max(h1, h2));
		}
		return result;
	}
	
	//递归，更新子节点的边界
	var updateChildrenEdges = function(node, moving)
	{
		updateChildrenPosition(node, moving, 0, -1, null);
	}
	
	//递归，更新子节点的边界，同时确定位置
	//@return int
	var updateChildrenPosition = function(node, moving, y, level, levelHeights)
	{
		var yEnd = -1;
		if(!node.isLeaf() && !isAsLeaf(node))
		{
			var isOnlyEdges = (levelHeights == null);
			if(!isOnlyEdges)
			{
				var levelHeight = levelHeights[level];
				if(node.isWithBeanpodChildren())
				{
					y += levelHeight + _this.getCustomView().getBeanpodSiblingGap() * 2;
				}
				else
				{
					y += levelHeight + _this.getCustomView().getLevelDistance();
				}
			}

			for(var i = 0; i < node.getChildCount(); i++)
			{
				var child = node.getChild(i);
				var edges = child.getExtProperty(KEY_EDGES);
				//更新后代各节点的边界。其实只要第一边界（位置）足够，即edges.get(0).move(moving);
				edges.move(moving);

				if(node.isWithBeanpodChildren())
				{
					if(!isOnlyEdges)
					{
						var currentYEnd = 
							updateBeanpodChildrenPosition(node, edges.get(0).getLeft(), y);
						if(currentYEnd > yEnd)
						{
							yEnd = currentYEnd;
						}
					}
				}
				else
				{
					var rect = null;
					if(!isOnlyEdges)
					{
						rect = child.getExtProperty(KEY_RECTANGLE);
						var edge = edges.get(0);
						rect.setX(edge.getLeft());
						rect.setY(y);
					}
					//递归
					var currentYEnd = 
						updateChildrenPosition(child, moving, y, level + 1, levelHeights);
					if(!isOnlyEdges)
					{
						if(currentYEnd < 0)//没有子
						{
							currentYEnd = y + rect.getHeight();
						}
						if(currentYEnd > yEnd)
						{
							yEnd = currentYEnd;
						}
					}
				}
			}
		}
		return yEnd;
	}
	
	//@param x是纵向子层的左沿（与父的左沿齐），y是子层的上沿
	//@return int
	var updateBeanpodChildrenPosition = function(vParent, x, y)
	{
		var childX = x + _this.getCustomView().getBeanpodBusWidth();
		var childY = y;
		for(var i = 0; i < vParent.getChildCount(); i++)
		{
			var vChild = vParent.getChild(i);
			var rect = vChild.getExtProperty(KEY_RECTANGLE);
			rect.setX(childX);
			rect.setY(childY);
			var height = rect.getHeight();
			childY += height + _this.getCustomView().getBeanpodSiblingGap();
		}
		return childY;
	}
	
	this.createUI = function(offsetX, offsetY)
	{
		_offsetX = (offsetX ? offsetX : 0); 
		_offsetY = (offsetY ? offsetY : 0);
		
		_ui = document.createElement("div");
		innerUpdateUI(_ui);
	
		return _ui;
	}
	
	this.updateUI = function()
	{
		_ui.innerHTML = "";
		innerUpdateUI(_ui);
	}
	
	var innerUpdateUI = function(div)
	{
		var dim = confirmNodesPosition(_offsetX, _offsetY);

		div.style.width= dim.getWidth() + 5;
		div.style.height = dim.getHeight() + 5;

		var root = _this.getModel().getRoot();
		paintNodeRecursion(div, root, 0);
//		_this.getCustomView().updateAllCtrlVisible(div);
	}
	
	//递归，广度优先，先序
	//@param div父容器; node目标节点; level第几层
	var paintNodeRecursion = function(div, node, level)
	{
		var rect = node.getExtProperty(KEY_RECTANGLE);
		var x = rect.getX();
		var y = rect.getY();
		var width = rect.getWidth();
		var height = rect.getHeight();
		var middle = x + width / 2;

		if(level > 0)
		{
			//画承上的线
			_this.getCustomView().drawPreceding(div, node, middle, y);
		}
		//画节点
		_this.getCustomView().drawNode(div, node, x, y, width, height);
		
		if(node.isAllowsExpand() && !node.isExpanded())
		{
			return;
		}
		
		if(node.isWithBeanpodChildren())//纵向子
		{
			var yParentAss = y + height;
			paintBeanpodChildren(div, node, x, yParentAss);
		}
		else if(!node.isLeaf())//普通分支
		{
			var nodeAssY = y + height;
			var yChild = y + _levelHeights[level] + _this.getCustomView().getLevelDistance();
			var lineLeft = 0;
			var lineRight = 0;
			var lastEdge = null;
			var childHeight = _levelHeights[level + 1];
			for(var i = 0, c = node.getChildCount(); i <= c; i++)
			{
				var childEdge = null;
				if(i < c)
				{
					var child = node.getChild(i);
					paintNodeRecursion(div, child, level + 1);
					childEdge = child.getExtProperty(KEY_EDGES).get(0);
				}
				
				var realRelationWidth = 
						_this.getCustomView().getSiblingGap(node.getChildrenRelation(i));
				var xRelation = (lastEdge == null 
						? childEdge.getLeft() - realRelationWidth 
						: lastEdge.getRight());
				var wRelation = (childEdge == null
						? realRelationWidth
						: childEdge.getLeft() - xRelation);
				_this.getCustomView().drawRelation(div, node, node.getChildrenRelation(i), 
						xRelation, yChild, wRelation, childHeight);
				
				lastEdge = childEdge;
				if(i == 0)
				{
					lineLeft = childEdge.getMiddle();
				}
				if(i == c - 1)
				{
					lineRight = childEdge.getMiddle();
				}
			}
			//画启下的线
			_this.getCustomView().drawFollowing(div, node, lineLeft, lineRight, middle, nodeAssY, yChild);
		}
	}
		
	var paintBeanpodChildren = function(div, vParent, x, yParentAss)
	{
		var childMidY = 0;
		var xBeans = new Array();
		var yBeans = new Array();
		for(var i = 0; i < vParent.getChildCount(); i++)
		{
			var vChild = vParent.getChild(i);
			var rect = vChild.getExtProperty(KEY_RECTANGLE);
			var childX = rect.getX();
			var childY = rect.getY();
			var childHeight = rect.getHeight();
			var childWidth = rect.getWidth();
			_this.getCustomView().drawNode(div, vChild, childX, childY, childWidth, childHeight);
			childMidY = childY + childHeight / 2;
			xBeans[i] = childX;
			yBeans[i] = childMidY;
		}
		var busX = x + _this.getCustomView().getBeanpodBusWidth() / 2;
		_this.getCustomView().drawBeanpodBus(div, vParent, busX, yParentAss, xBeans, yBeans);
	}
	
	//节点收起时当叶子看待
	var isAsLeaf = function(node)
	{
		return _isDynamicLayout && node.isAllowsExpand() && !node.isExpanded();
	}
}


//*********************************************************
//*  缺省的视图，可继承此类覆盖方法或按此类接口另自定义实现
//*********************************************************
function DefaultHorizontalTreeView()
{
	var _tree;
	
	this.setTree = function(tree)
	{
		_tree = tree;
	}
	
	this.getTree = function()
	{
		return _tree;
	}
	
	//节点大小	
	this.calculateNodeSize = function(node)
	{
		return new Dimension(100, 50);
	}

	//层间距
	this.getLevelDistance = function()
	{
		return 40;
	}

	//亲兄弟节点的水平间距
	this.getSiblingGap = function(relation)
	{
		return 24;
	}

	//表兄弟节点的水平间距
	this.getCousinGap = function()
	{
		return 30;
	}
	
	//纵向子的连接线所占宽度，亦即纵向子左沿相对其父节点的缩进值
	this.getBeanpodBusWidth = function()
	{
		return 20;
	}

	//纵向子之间的垂直间距
	this.getBeanpodSiblingGap = function()
	{
		return 6;
	}

	this.drawPreceding = function(divOwner, node, x, y)
	{
		//画承上的线
		var upMidY = y - this.getLevelDistance() / 2;
		var div = drawVLine(divOwner, x, upMidY, y);
		div.visibleControllerNode = node.getParent();
	}
	
	this.drawFollowing = function(divOwner, node, x1, x2, xParentAss, yParentAss, yChildren)
	{
		var downMidY = yChildren - this.getLevelDistance() / 2;
		//画启下的线
		var div = drawVLine(divOwner, xParentAss, yParentAss, downMidY);
		div.visibleControllerNode = node;
		//画横线
		div = drawHLine(divOwner, x1, x2, downMidY);
		div.visibleControllerNode = node;
	}

	this.drawNode = function(divOwner, node, x, y, width, height)
	{
		var div = document.createElement("div");
		div.style.position = "absolute";
		div.style.left = x;
		div.style.top = y;
		div.style.width = width;
		div.style.height = height;
		div.style.border = "1 solid black";
		div.innerText = x + "," + y;
		divOwner.appendChild(div);
		
		div.visibleControllerNode = node.getParent();
	}

	this.drawRelation = function(divOwner, parentNode, relation, x, y, width, height)
	{
		if(relation)
		{
			var div = document.createElement("div");
			div.style.position = "absolute";
			div.style.left = x;
			div.style.top = y;
			div.style.width = width;
			div.style.height = height;
			div.innerText = relation;
			div.style.textAlign = "center";
			divOwner.appendChild(div);
			
			div.visibleControllerNode = parentNode;
		}
	}

	this.drawBeanpodBus = function(divOwner, node, x, y, xBeans, yBeans)
	{
		var lastBeanIdx = xBeans.length - 1;
		var div = drawVLine(divOwner, x, y, yBeans[lastBeanIdx]);
		div.visibleControllerNode = node;
		for(var i = 0; i <= lastBeanIdx; i++)
		{
			div = drawHLine(divOwner, x, xBeans[i], yBeans[i]);
			div.visibleControllerNode = node.getChild(i);	
		}
	}
	
	//画横线
	var drawHLine = function(divOwner, x1, x2, y, style)
	{
		var div = document.createElement("div");
		div.style.fontSize = 0;
		div.style.position = "absolute";
		div.style.left = x1;
		div.style.top = y;
		div.style.width = x2 - x1;
		div.style.height = 1;
		div.style.borderTop = (style ? style : "1 solid black");
		divOwner.appendChild(div);
		return div;
	}
	
	//画竖线
	var drawVLine = function(divOwner, x, y1, y2, style)
	{
		var div = document.createElement("div");
		div.style.fontSize = 0;
		div.style.position = "absolute";
		div.style.left = x;
		div.style.top = y1;
		div.style.width = 1;
		div.style.height = y2 - y1;
		div.style.borderLeft = (style ? style : "1 solid black");
		divOwner.appendChild(div);
		return div;
	}
	
//	//一个展开操作之后，显式调用，更新可见状态
//	//注意：View自定义实现时，每添加一个控件，都要加上属性visibleControllerNode
//	this.updateAllCtrlVisible = function(divOwner)
//	{
//		var children = divOwner.childNodes;
//		for(var i = 0; i < children.length; i++)
//		{
//			var child = children[i];
//			var node = child.visibleControllerNode;
//			var visible = true;
//			while(node)
//			{
//				if(node.isAllowsExpand() && !node.isExpanded())
//				{
//					visible = false;
//					break;
//				}
//				node = node.getParent();
//			}
//			child.style.visibility = (visible ? "visible" : "hidden");
//		}
//	}

}
