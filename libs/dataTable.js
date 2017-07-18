/* Autor: Edgardo Gordillo
 * Fecha: 14/07/2017
 * Desc: Libreria para crear tablas
 *
 * */

// if ( typeof $ === 'undefined' ) throw new Error( 'JavaScript Error: jQuery es requerido para este plugin' );

(function ( $ ) {

var splitParametros = function ( del ) {
	if ( !this ) return [];

	var array = [],
		m = this.split( del );

	for( var i = 0, lon = m.length; i < lon; i++ ) array.push( m[ i ].trim() );
	return array;
}

var lecturaDeep = function ( obj, campo ) {
	/*
	 * Retorna el valor o matriz de valores de la propiedad de un objeto
	 * permite obtener los valores de propiedades recursivas campo1.subcam1.subcam2.subcamN...
	 * Ejemplo 1: data = lecturaDeep( { campo1: 'valor' }, 'campo1' )
	 * Retorno 1: 'valor'
	 * Ejemplo 2: data = lecturaDeep( { cam1: { sub1: 'valor' } }, 'cam1' );
	 * Retorno 2: { sub1: 'valor' }
	 * Ejemplo 3: data = lecturaDeep( { cam1: { sub1: 'valor' } }, 'cam1.sub1' );
	 * Retorno 3: 'valor'
	 * Ejemplo 4: data = lecturaDeep( { cam1: { sub1: 'valor1' }, cam2: { sub1: { sub2: 'valor2' } } }, 'cam1.sub1, cam2.sub1.sub2' );
	 * Retorno 4: [ 'valor1', 'valor2' ]
	 */

	if ( !obj )
	{
		console.error( 'function: lecturaDeep, [obj] is null' );
		return null;
	}

	var m = campo.splitParametros( ',' );

	if ( m.length == 1 )
	{
		var n = m[ 0 ].splitParametros( '.' ), // filtramos los subcampos
			temp = null;

		if ( n.length > 1 )
		{
			temp = obj[ n[ 0 ] ];

			for ( var j = 1, lon_j = n.length; j < lon_j; j++ ) // recorremos los subcampos
			{
				temp = temp[ n[ j ] ];
			}

			return temp;
		}

		else return obj[ m[ 0 ] ];
	}

	else if ( m.length > 1 )
	{
		var mtz = [];

		for ( var i = 0, lon_i = m.length; i < lon_i; i++ ) // recorremos los campos
		{
			var n = m[ i ].splitParametros( '.' ), // filtramos los subcampos
				temp = null;

			if ( n.length > 1 )
			{
				temp = obj[ n[ 0 ] ];

				for ( var j = 1, lon_j = n.length; j < lon_j; j++ ) // recorremos los subcampos
				{
					temp = temp[ n[ j ] ];
				}

				mtz.push( temp );
			}

			else mtz.push( obj[ m[ i ] ] );
		}

		return mtz;
	}

	else console.log( 'function: lecturaDeep, [m] is empty' );
}

var dataTable = function ( opt ) {
	/*
	 * head - String "campo1, campo2"
	 * body
	 *
	 * arr - Array [{campo1: valor1, campo2: valor2}]
	 * numFilas - Integer
	 * numElementos - Integer
	 * campo
	 * addClass
	 * val_campo
	 * color_fila
	 */

	/**
	 * Variables de configuracion de uso interno
	 * @type {Object}
	 */
	var private = {
		pag: {
			numPagesPerElement: 5, // DEVELOPING - numero de elementos que contendrá el paginador
			arrayRangesButtonPaginator: [],
			currentRangeButtonPaginator: {},
			$nav: null,
			$listPages: null,
			$prev: null,
			$liPrev: null,
			$liNext: null,
			$paginator: null,
			elements: []
		}
	};

	opt.color_fila = opt.color_fila || ''
	opt.addClass = opt.addClass || {};

	/* validar el numero de filas te tendrá la tabla en cada pagina
	 * y la cantidad de datos que procesará, para calcular el numero
	 * de paginas que se crearan asi como los rangos de cada pagina
	 */
	if( !opt.numFilas ) 
	{
		console.error("Numero de filas [numFilas] es requerido");
		return;
	}

	if( !opt.numElementos )
	{
		console.error("Numero de elementos [numElementos] es requerido");
		return;
	}

	// verificar callback del evento click del paginador
	var callbackPaginator = null;
	if ( typeof opt.callbackPaginator === 'function' ) callbackPaginator = opt.callbackPaginator;
	else callbackPaginator = function (){};

	var that = this,
		numFilas = opt.numFilas,
		numElementos = opt.numElementos;

	var struct_head = function ( arr ) 
	{
		if ( $.isEmptyObject( arr ) ) 
		{
			return;
		}

		var IDS    = this.IDS,
			m      = arr.splitParametros( ',' ),
			i      = 0,
			lon    = m.length,
			head   = '',
			filter = '';

		var $headerContent = $('<tr></tr>');

		for( i; i < lon; i++ ) $headerContent.append( $( '<th style="white-space: nowrap;"></th>' ).append( m[ i ] ) );
		if ( IDS.$tableHeader ) IDS.$tableHeader.append( $headerContent );
	}

	var struct_body = function ( arr, campo, addClass, numFilas ) 
	{
		if ( $.isEmptyObject( arr ) || !campo || !this.IDS.$tableBody ) 
		{
			return;
		}

		var color_fila = opt.color_fila || '',
			flag_      = true;

		var returnClass = function ( mtz_class, mtz_campo, mtz_valor, fila ) 
		{
			for ( var i = 0, lon = mtz_campo.length; i < lon; i++ )
			{
				var	index = mtz_valor.indexOf( lecturaDeep( fila, mtz_campo[ i ] ) );
				if ( eval != -1 )
					return mtz_class[ index ];
			}

			return '';
		};

		if ( typeof addClass.body == 'object' ) 
		{
			var
				mtz_class = addClass.body.class.splitParametros( ',' ),
				mtz_campo = addClass.body.campo.splitParametros( ',' ),
				mtz_valor = addClass.body.valor.splitParametros( ',' );

			// console.log( 'mtz_class: ' + mtz_class.length + ' campo: ' + mtz_campo.length + ' valor: ' + mtz_valor.length );

			if ( mtz_class.length == mtz_campo.length && // silogismo hipotético
			 	 mtz_campo.length == mtz_valor.length ) flag_ = false;
			else console.log( 'Matrices [mtz_class], [mtz_campo], [mtz_valor] no son de la misma longitud' );
		}

		/*
		 * estructurar los tokens de los campos, las cadenas validas para su lectura
		 * son del formato:
		 * 'campo_1, campo_2, campo_3' y 'campo_1.sub_1, campo_2.sub_1, campo_3.sub_1'
		 */
		var m      = campo.splitParametros( ',' ), // filtramos los campos
			k      = 0,
			lon_k  = arr.length,
			$tableBody = this.IDS.$tableBody;

		$tableBody.empty(); // limpiamos los rows de la tabla

		/**
		 * Renderizamos los nuevos rows en la tabla
		 */
		for ( k; k < lon_k; k++ ) 
		{
			/**
			 * validamos que las filas renderizadas sean iguales
			 * a la cantidad de filas que se configuró por cada
			 * pagina
			 */
			if ( k < numFilas ) 
			{
				/**
				 * si es false es por que existe un addClass
				 */
				color_fila = flag_ ?
					opt.color_fila :
					returnClass( mtz_class, mtz_campo, mtz_valor, arr[ k ] );

				var $row = $( '<tr></tr>' )
					.addClass( color_fila )
					.attr( 'table-index', k );

				for ( var i = 0, lon_i = m.length; i < lon_i; i++ ) // recorremos los campos
					$row.append(
						$( '<td style="white-space: nowrap;"></td>' ).html( lecturaDeep( arr[ k ], m[ i ] ) )
					);

				$tableBody.append( $row );
			}
		}
	}


	/**
	 * Determina la posicion del rango de Botones donde esta ubicado
	 * el elemento [<li>]
	 */
	var returnIndexRangesButtonPaginator  = function( arrayRangesButtonPaginator, indexButton ) {
		// console.log(arrayRangesButtonPaginator);
		for ( var j in arrayRangesButtonPaginator ) 
		{
			var obj     = arrayRangesButtonPaginator[ j ];
			var element = obj.element;
			var first   = obj.first;
			var last    = obj.last;

			if ( indexButton >= first && indexButton <= last ) return element;
		}

		return -1;
	}

	var calcNumElementsRangesButtonPaginator = function ( numPages, numPagesPerElement ) {
		// si la cantidad de elementos por pagina es
		// mayor a la cantidad de elementos existentes en
		// el servidor (totales), el numero de paginas siempre será = [1]
		if ( numPagesPerElement >= numPages ) return 1;

		var numElementsRangesButtonPaginator = parseInt( numPages / numPagesPerElement );

		// validamos que aun exiten registros que no completan el bloque de numRows
		// si existen agregamos una nueva pagina
		if ( (numPages % numPagesPerElement) > 0 ) numElementsRangesButtonPaginator++;
		return numElementsRangesButtonPaginator;
	}

	var calcArrayRangesButtonPaginator = function ( numPagesPerElement, numPages, numElementsRangesButtonPaginator ) {
		var arr = [];
		var first = 0, last = (numPagesPerElement - 1); // iniciamos en 0 pues lo trabajaremos como arreglos

		/**
		 * definimos la primera pagina manualmente
		 */
		arr.push({
			element: 1,
			first: first,
			last: last
		});

		/**
		 * le quitamos una iteracion porque la primera
		 * pagina la definimos estaticamente, [ i = 1 ]
		 * en el [for]
		 */
		for ( var i = 1; i < numElementsRangesButtonPaginator; i++ ) {

			/**
			 * Mover al siguiene elemento del rango
			 * superior de la iteracion anterior,
			 * ahi iniciaremos el nuevo rango
			 */
			first = last + 1;

			/**
			 * verificamos que sea el ultimo elemento del numero
			 * de los rangos calculados.
			 * si es el ultimo elemento, pondra como valor
			 * final al tamaño máximo de los datos
			 */
			if ( i != (numElementsRangesButtonPaginator - 1) ) {

				last = (( i + 1 ) * numPagesPerElement) - 1; // numero de pagina X numero de filas por pagina

			}

			else {

				last = (numPages - 1);
			}

			arr.push({
				element: (i + 1),
				first: first,
				last: last
			});

			// console.log('first: ' + first);
			// console.log('last: ' + last);
		}


		return arr;
	}

	/**
	 * @param  {[Integer]} numero de elementos totales del arreglo
	 * @param  {[Integer]} numero de elementos que soporta cada pagina
	 * @return {[void]}
	 */
	var struct_pagination = function ( numElements, numRows ) 
	{

		var that = this, IDS = this.IDS;

		var calcularPaginas = function () {
			// si la cantidad de elementos por pagina es
			// mayor a la cantidad de elementos existentes en
			// el servidor (totales), el numero de paginas siempre será = [1]
			if ( numRows >= numElements ) return 1;

			var numPages = parseInt( numElements / numRows );

			// validamos que aun exiten registros que no completan el bloque de numRows
			// si existen agregamos una nueva pagina
			if ( (numElements % numRows) > 0 ) numPages++;
			return numPages;
		}

		/**
	 	 * @param  {[Integer]} numero de paginas que contiene la tabla
	 	 * @param  {[Integer]} numero de elementos que soporta cada pagina
	 	 * @param  {[Integer]} numero de elementos totales del arreglo
		 * @return {[Array]} Arreglo de objetos [{page: 1, range:[1,10]]
		 */
		var calcRangesByPage = function ( numPages, numRows, numElements ) {
			var arr = [];
			var first = 1, last = numRows;

			// definimos la primera pagina manualmente
			arr.push({
				page: 1,
				range: [first, last]
			});

			// le quitamos una iteracion porque la primera
			// pagina la definimos estaticamente
			for ( var i = 1; i < numPages; i++ ) {

				first = last + 1;

				// verificamos que sea el ultimo elemento
				// si es la ultima pagina pondra como valor
				// final al tamaño máximo de los datos
				if ( i != (numPages - 1) ) {

					last = ( i + 1 ) * numRows; // numero de pagina X numero de filas por pagina

				}

				else {

					last = numElements;
				}

				arr.push({
					page: (i + 1),
					range: [first, last]
				});

				// console.log('first: ' + first);
				// console.log('last: ' + last);
			}


			return arr;
		}

		var numPages = calcularPaginas();
		var ranges   = calcRangesByPage( numPages, numRows, numElements );

		/**
		 * Cantidad de botones de pagina que existen
		 */
		var lon = ranges.length;

		var numElementsRangesButtonPaginator = calcNumElementsRangesButtonPaginator( numPages, private.pag.numPagesPerElement );
		var arrayRangesButtonPaginator = calcArrayRangesButtonPaginator( private.pag.numPagesPerElement, numPages, numElementsRangesButtonPaginator );
		
		/**
		 * @type {[type]}
		 */
		private.pag.arrayRangesButtonPaginator = arrayRangesButtonPaginator;

		/**
		 * creamos la estructura del paginador
		 */
		var $nav = $('<nav>');
		var $listPages = $('<ul>').addClass('pagination pagination-lg');

		var $prev = $('<a href="#" aria-label="Previous">').append('<span aria-hidden="true">&laquo;</span>');
		var $next = $('<a href="#" aria-label="Next">').append('<span aria-hidden="true">&raquo;</span>');
		var $liPrev = $('<li>').append( $prev );
		var $liNext = $('<li>').append( $next );

		/**
		 * centramos el paginador
		 */
		var $paginator =  $('<div>').addClass('text-center').append($nav);
		
		/**
		 * Iteramos para crear los botones de las paginas, y los 
		 * guardamos en la variable [private.pag]
		 */
		for ( var i = 0; i < lon; i++ ) 
		{
			var obj = ranges[ i ];
			var $li = $('<li>')
				.attr('button-index', 'true')
				.append(
					/**
					 * Creamos el elemento <a> asi como su logica
					 * ya que será el contenedor del evento [click]
					 */
					$('<a href="#">')
						.attr({
							'data-range-index': i,
							'data-range-first': obj.range[0],
							'data-range-last': obj.range[1]
						})
						.text(obj.page)
				);

			var indexRangeButtons = returnIndexRangesButtonPaginator( arrayRangesButtonPaginator, i );
			$li.attr('index-range-buttons', indexRangeButtons);

			/**
			 * si es la primera pagina la marcamos como activa
			 */
			if ( obj.page == 1 ) $li.addClass('active');

			/**
			 * Agregamos el elementos a la variable privada
			 * para tener acceso global
			 */
			private.pag.elements.push( $li );
		}

		/**
		 * Almacenamos nuestros elementos en la variable [private.pag] 
		 * para renderizarlos de manera dinamica
		 */
		private.pag.$nav       = $nav;
		private.pag.$listPages = $listPages;
		private.pag.$prev      = $prev;
		private.pag.$next      = $next;
		private.pag.$liPrev    = $liPrev;
		private.pag.$liNext    = $liNext;
		private.pag.$paginator = $paginator;

		renderPageButtons( 1 );
	}

	var renderPageButtons = function ( indexRangeButtons ) 
	{
		var $nav        = private.pag.$nav;
		var $listPages  = private.pag.$listPages;
		var $prev       = private.pag.$prev;
		var $next       = private.pag.$next;
		var $liPrev     = private.pag.$liPrev;
		var $liNext     = private.pag.$liNext;
		var $paginator  = private.pag.$paginator;
		var elements    = private.pag.elements;
		var arrayRangesButtonPaginator = private.pag.arrayRangesButtonPaginator;

		// if ( arrayRanges.length == 0 ) {
		// 	console.error('Function [renderPageButtons]: Arreglo de rangos de botonos no definidos');
		// 	return;
		// }

		/**
		 * Eliminamos todos los elementos
		 * para renderizar el nuevo rango
		 */
		$listPages.empty();

		/**
		 * evento del boton [Prev]
		 */
		$prev.on('click', function(event) 
		{
			event.preventDefault();

			/**
			 * Encuentra el boton que sea un boton de pagina y este marcado como [activo]
			 */
			$listPages.find('[button-index=true][class*="active"]').each(function(index, el) 
			{
				/**
				 * El elemento <a> es el propietario de los eventos click, asi como de los atributos
				 * que indexan los rangos.
				 *
				 * obtenemos el indice de pagina que le corresponde el elemento <a>
				 */
				var index = parseInt($(this).children('a').attr('data-range-index'));

				/**
				 * investigamos a que numero de segmento de paginacion le corresponde
				 * el boton actual y el boton siguiente
				 */
				var currentPage = returnIndexRangesButtonPaginator ( arrayRangesButtonPaginator, index );
				var prevElementPage = returnIndexRangesButtonPaginator ( arrayRangesButtonPaginator, ( index - 1 ) );

				if ( prevElementPage != -1 ) 
				{
					// console.log( "(index - 1): " + (index - 1) + ' index: ' + index );
					// console.log( "prevElementPage: " + prevElementPage + ' currentPage: ' + currentPage );
					
					if ( currentPage != prevElementPage ) renderPageButtons( prevElementPage );

					index--;
					$listPages.find('[button-index=true]').find('[data-range-index="' + index + '"]').each(function(i, el) {
						$(this).click();
					});
				}
			});
		})

		/**
		 * 
		 */
		$liPrev.append( $prev );

		$listPages.append( $liPrev ); // renderiza boton Prev

		/**
		 * Renderizar el rango de paginas definidas
		 * el indice del rango de pagina se encuentra
		 * en el atributo [<li index-range-buttons="1">]
		 */
		var lon = elements.length;
		for ( var i = 0; i < lon; i++ )
		{
			var $elem = elements[ i ];
			var index = $elem.attr('index-range-buttons');
			if ( index == indexRangeButtons ) 
			{
				$elem.find('a').each(function(index, el) 
				{
					/**
					 * evento del boton paginador [1,2,3,4,5...]
					 */
					$( this ).on('click', function(event) 
					{
						event.preventDefault();
						$this = $(this);

						/**
						 * buscamos a los elementos que sean botones
						 * con numeros (button-index) y le quitamos el efecto de
						 * seleccionado
						 */
						$listPages.find('[button-index=true]').each(function(index, el) {
							$(this).removeClass('active');
						});

						/**
						 * agregamos el estado de activo al elemento
						 * que le demos click
						 */
						$this.parent('li').addClass('active');

						/**
						 * llamamos el callback del dataTable y le pasamos como
						 *  parametro [ indiceinicial, indicefinal ]
						 */
						callbackPaginator( $this.attr('data-range-first'), $this.attr('data-range-last') );
					})
				});

				$listPages.append( $elem );
			}
		}

		$liNext = $('<li>').append(
			/**
			 * evento del boton [siguiente]
			 */
			$next.on('click', function(event) 
			{
				event.preventDefault();

				/**
				 * Encuentra el boton que sea un boton de pagina y este marcado como [activo]
				 */
				$listPages.find('[button-index=true][class*="active"]').each(function(index, el) {
					/**
					 * El elemento <a> es el propietario de los eventos click, asi como de los atributos
					 * que indexan los rangos.
					 *
					 * obtenemos el indice de pagina que le corresponde el elemento <a>
					 */
					var index = parseInt($(this).children('a').attr('data-range-index'));

					/**
					 * investigamos a que numero de segmento de paginacion le corresponde
					 * el boton actual y el boton siguiente
					 */
					var currentPage = returnIndexRangesButtonPaginator ( arrayRangesButtonPaginator, index );
					var nextElementPage = returnIndexRangesButtonPaginator ( arrayRangesButtonPaginator, ( index + 1 ) );

					if ( nextElementPage != -1 ) 
					{
						// console.log( 'index: ' + index + " (index + 1): " + (index + 1) );
						// console.log( 'currentPage: ' + currentPage + " nextElementPage: " + nextElementPage );
						
						if ( currentPage != nextElementPage ) renderPageButtons( nextElementPage );

						index++;
						$listPages.find('[button-index=true]').find('[data-range-index="' + index + '"]').each(function(i, el) {
							$(this).click();
						});
					}
				});
			})
		);



		$listPages.append( $liNext ); // renderiza boton Next
		$nav.append($listPages);
		IDS.$content.append($paginator);
	}

	var update_table = function ( arr ) 
	{
		this.IDS.$tableBody.empty();
		struct_body.call( this, arr, opt.campo, opt.addClass, numFilas );
	}

	var reset_table = function () 
	{
		this.IDS.$tableBody.empty();
	}

	var struct_document = function () 
	{
		var IDS = this.IDS;

		IDS.$tableHeader = $( '<thead></thead>' );
		IDS.$tableBody   = $( '<tbody></tbody>' );

		IDS.$table = $( '<table></table>' )
			.addClass( 'js-dynamitable table table-bordered table-hover' )
			.append( IDS.$tableHeader )
			.append( IDS.$tableBody );

		IDS.$content = $( '<div></div>' )
			.addClass( 'panel panel-default' )

			.append(
				$( '<div></div>' )
				.addClass( 'table-responsive' )
				.append( IDS.$table )
			)
	}

	var factory = function () 
	{
		var IDS = this.IDS;

		struct_document.call( this );
		struct_head.call( this, opt.head );
		struct_body.call( this, opt.arr, opt.campo, opt.addClass, numFilas );
		struct_pagination.call( this, numElementos, numFilas );

		if ( typeof this !== 'undefined' ) {
			$( that ).append( IDS.$content );

			// if ( !$.isEmptyObject( opt.contextMenu ) ) {
			// 	IDS.$tableBody.contextMenu( opt.contextMenu );
			// }
		}

		return this;
	}

	var IDS = {
		$content    : null,
		$table      : null,
		$tableBody  : null,
		$tableHeader: null,
		paginator: {
			$prev: null,
			$next: null,
			pages: []
		}
	}

	var table = {
		IDS: IDS,
		pages: null
	};

	table.factory = factory.bind( table );
	table.updateTable = update_table.bind( table );
	table.resetTable = reset_table.bind( table );
	return table;
}

$.extend( jQuery.fn, {dataTable: dataTable});
$.extend( String.prototype, { splitParametros: splitParametros } );
})( jQuery )