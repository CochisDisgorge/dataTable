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
		numPaginatorElements: 7, // DEVELOPING - numero de elementos que contendrá el paginador
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
		// console.log(ranges);

		/**
		 * creamos la estructura del paginador
		 */
		var $nav = $('<nav>');
		var $listPages = $('<ul>').addClass('pagination pagination-md');

		var $prev = $('<a href="#" aria-label="Previous">').append('<span aria-hidden="true">&laquo;</span>');
		var $next = $('<a href="#" aria-label="Next">').append('<span aria-hidden="true">&raquo;</span>');

		/**
		 * Cantidad de botones de pagina que existen
		 */
		var lon = ranges.length;

		$listPages.append(
			$('<li>').append(
				/**
				 * evento del boton [anterior]
				 */
				$prev.on('click', function(event) {
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
						var index = $(this).children('a').attr('data-range-index');
						// console.log(index);

						/**
						 * validamos que al dar click en anterior no desbordemos
						 * de la cantidad de botones existentes
						 */
						if ( index < lon && index > 0 ) {
							index--;
							$listPages.find('[button-index=true]').find('[data-range-index="' + index + '"]').each(function(index, el) {
								$(this).click();
							});
						}
					});
				})
			)
		);

		for ( var i = 0; i < lon; i++ ) {
			var $li = $('<li>').attr('button-index', 'true');;
			var obj = ranges[ i ];

			// si es la primera pagina la marcamos como activa
			if ( obj.page == 1 ) $li.addClass('active');

			$listPages.append(
				$li.append(
					$('<a href="#">')
						.attr({
							'data-range-index': i,
							'data-range-first': obj.range[0],
							'data-range-last': obj.range[1]
						})
						.text(obj.page)

						/**
						 * evento del boton paginador [1,2,3,4,5...]
						 */
						.on('click', function(event) {
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
				)
			);

			IDS.paginator.pages.push( $li );
		}

		$listPages.append(
			$('<li>').append(
				/**
				 * evento del boton [siguiente]
				 */
				$next.on('click', function(event) {
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
						var index = $(this).children('a').attr('data-range-index');
						// console.log(index);

						/**
						 * validamos que al dar click en siguiente no desbordemos
						 * de la cantidad de botones existentes
						 */
						if ( index >= 0 && index < (lon -1 )  ) {
							index++;
							$listPages.find('[button-index=true]').find('[data-range-index="' + index + '"]').each(function(index, el) {
								$(this).click();
							});
						}
					});
				})
			)
		);
		$nav.append($listPages);

		IDS.$content.append(
			/**
			 * centramos el paginador
			 */
			$('<div>').addClass('text-center').append($nav)
		);
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