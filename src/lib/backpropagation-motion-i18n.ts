export const motionUi = {
  ja: {
    title: '順伝播と逆伝播を数字で追う',
    intro:
      '数字が配列から取り出され、掛け合わされ、足されて、計算先の要素に入るまでを再生します。',
    demo: '計算の種類',
    demos: {
      linear: '線形変換',
      residual: '残差接続',
      attention: 'self-attention',
    },
    direction: '計算の向き',
    forward: '順方向',
    backward: '逆方向',
    linearNote:
      'W は 2 × 3 の配列、x は 3 成分のベクトルです。W の 1 行と x を掛け合わせて足すと、y の 1 成分ができます。bias は省略しています。',
    linearRowReady:
      '再生すると、x の列が横一列になり、W の最初の行の近くへ移動します。',
    linearRowNext: '① x を次の行へ下ろす',
    linearRowPhases: [
      '① x を横一列にして W の行の近くへ置く',
      '② 対応する要素を掛け、足し合わせる',
      '③ この行の計算結果を表示する',
      '④ 結果を y に入れる',
    ],
    linearRowViewport:
      'x の列を横一列に並べ、W の各行との積の和を y に入れるアニメーション。',
    linearWeightReady:
      '再生すると、1 つの出力勾配が x の列を上から順にたどり、積を 1 つずつ格納します。',
    linearInputReady:
      '再生すると、出力の勾配の列が W の最初の列の隣へ移動します。',
    linearWeightStep: '出力勾配を x に掛け、積を ∂L/∂W に格納する',
    linearInputStep: '出力勾配と W の列の積を足し、∂L/∂x に格納する',
    linearWeightExplanation:
      '∂L/∂W[i,j] = (∂L/∂y[i]) × x[j]。同じ出力勾配で x の列を上から順にたどり、各積を ∂L/∂W の 1 行へ左から順に格納します。x を一巡したら、次の出力勾配で繰り返します。',
    linearInputExplanation:
      '∂L/∂x[j] = Σᵢ W[i,j] × (∂L/∂y[i])。W の同じ列を使う各出力からの寄与を足し、入力の勾配の 1 成分に入れます。',
    linearWeightHint:
      '計算先の要素を選ぶと、その要素の計算から確認できます。スライダーで戻したり、1 要素ずつ進めたりできます。',
    linearWeightViewport:
      '1 つの出力勾配が x の列を上から下へ移動し、積を重みの勾配へ 1 つずつ格納するアニメーション。',
    linearInputViewport:
      '出力勾配の列を W の各列に沿って動かし、積の和を入力の勾配へ入れるアニメーション。',
    backwardNote:
      '与えられた ∂L/∂y = [2, −1] から始めます。W と x は順伝播の値を使い、重みと入力の勾配をそれぞれ計算します。',
    residualNote:
      'y = x + F、F = Wx。加算では勾配を両方の経路へ渡し、x に戻った 2 つの寄与を足します。',
    attentionNote:
      '3 位置 × 2 成分、1 head。Q・K・V の射影、causal mask、softmax、加重和を計算します。bias・出力射影は省略しています。',
    attentionBackwardNote:
      '∂L/∂O は最後の位置だけ [1, −0.5] とします。順伝播で保存した値と、この勾配から各重みへの勾配を計算します。',
    spatialReady: '再生すると、使う行・列・要素が計算する場所へ移動します。',
    spatialStep: '要素を並べて計算し、結果を格納する',
    spatialViewport:
      '元の配列を残し、使う数字を行や列の隣へ動かして演算し、結果を格納するアニメーション。',
    splitStage: '加算の逆伝播',
    splitStep: '同じ出力勾配を、skip 側と F 側へ渡す',
    splitExplanation:
      'y = x + F の微分は、両入力について 1 です。∂L/∂y の各成分を 1 倍して、skip 側の ∂L/∂x と ∂L/∂F に同時に渡します。その後、F = Wx を逆にたどり、最後に x へ戻る 2 つの勾配を足します。',
    causalMask: 'causal mask',
    prototype: '独立した試作 / BACKPROPAGATION',
    description:
      '小さな配列の数字を動かしながら、順伝播と逆伝播の計算手続きを追う試作。',
    sample: '説明用の計算例',
    relation: '記事に戻る：誤差逆伝播',
    available: 'ここまでに求めた値',
    given: '与えられた値',
    saved: '順伝播の値',
    result: '計算する値',
    stage: '計算する配列',
    play: '再生',
    pause: '一時停止',
    next: '1 手進む',
    previous: '1 手戻る',
    reset: '最初から',
    speed: '速度',
    progress: '計算の進み具合',
    phases: [
      '① 数字を選ぶ',
      '② 掛け合わせる',
      '③ 合計へ足す',
      '④ 計算先へ入れる',
    ],
    pass: '② 数字を移す',
    exp: '② exp を計算する',
    divide: '② 割り算する',
    hold: '④ この和を保持する',
    ready: '再生すると、最初の 2 つの数字から計算を始めます。',
    done: 'この配列の計算が完了しました。',
    sum: 'ここまでの和',
    product: '今回の寄与',
    to: '計算先',
    term: '項',
    hint: '計算先の要素をクリックすると、その要素の計算から再生できます。矢印キーで進み具合を動かすこともできます。',
    legend: '橙・青：今使う数字　緑：計算先　·：これから計算する要素',
    viewport:
      '数値と計算のアニメーション。小さい画面では横にスクロールできます。',
    masked: '未来の位置はマスクされ、スコアを −∞、その勾配を 0 とします。',
    explanation: {
      F: 'W の行の隣に x を並べ、対応する要素の積を足して F に格納します。',
      dBranch:
        'W の各列に ∂L/∂F を並べ、積を足します。これが変換側から x に戻る勾配です。',
      y: 'y[i] = Σⱼ W[i,j] × x[j]。1 行分の積を足して、y の 1 成分に入れます。',
      dW: '∂y[i]/∂W[i,j] = x[j]。出力の勾配 ∂L/∂y[i] と x[j] の積が、この重みの勾配になります。',
      dx: '∂y[i]/∂x[j] = W[i,j]。W の同じ列をたどり、各出力の勾配との積を足すと ∂L/∂x[j] になります。',
      residualDW:
        '∂L/∂F[i] を x[j] に掛け、∂L/∂W[i,j] に入れます。同じ出力勾配で x の列を上から順にたどります。',
      residualY: 'x と F の対応する成分を足して y に入れます。',
      residualDx:
        '同じ x が 2 つの経路で使われたため、両経路から届いた勾配を成分ごとに足します。',
      dSkip: '加算の微分は 1。∂L/∂y を、そのまま skip 側へ渡します。',
      dF: '加算の微分は 1。F 側にも同じ ∂L/∂y を渡します。',
      dS: 'softmax の微分は A[t,u] × (dA[t,u] − m[t])。同じ行の加重平均 m を引く計算も、積と加算で追います。',
      m: '同じ行の A と ∂L/∂A の積を足します。softmax の微分に使う加重平均です。',
      E: '各スコアの exp を計算します。この小さな例では exp(S) を直接求めます。',
      z: '同じ行の exp の値を足し、softmax の分母を作ります。',
      A: '各 exp の値をその行の合計で割ると、参照の重みになります。',
    },
    rounded:
      '表示は小数第 3 位まで。計算には丸め前の値を使います。説明用の入力と重みからブラウザ内で計算しています。',
    noScript: 'アニメーションを操作するには JavaScript を有効にしてください。',
  },
  en: {
    title: 'Follow the numbers, forward and backward',
    intro:
      'Watch numbers leave their array cells, multiply, add up, and enter the destination element.',
    demo: 'Computation',
    demos: {
      linear: 'Linear transformation',
      residual: 'Residual connection',
      attention: 'Self-attention',
    },
    direction: 'Direction',
    forward: 'Forward',
    backward: 'Backward',
    linearNote:
      'W is a 2 × 3 array and x is a vector with 3 components. Multiply one row of W by x and sum to obtain one component of y. Bias is omitted.',
    linearRowReady:
      'Press Play to unfold x into a row beside the first row of W.',
    linearRowNext: '① Move x down to the next row',
    linearRowPhases: [
      '① Unfold x beside the row of W',
      '② Multiply corresponding elements and add',
      '③ Show the result for this row',
      '④ Write the result into y',
    ],
    linearRowViewport:
      'Unfold x into a row, compute its dot product with each row of W, and write the result into y.',
    linearWeightReady:
      'Press Play to move one output gradient down the column of x and store each product in turn.',
    linearInputReady:
      'Press Play to move the output-gradient column beside the first column of W.',
    linearWeightStep:
      'Multiply the output gradient by x and store the product in ∂L/∂W',
    linearInputStep:
      'Sum the products of the output gradient and a column of W, then store in ∂L/∂x',
    linearWeightExplanation:
      '∂L/∂W[i,j] = (∂L/∂y[i]) × x[j]. Keep the same output gradient while visiting x from top to bottom. Store each product from left to right in one row of ∂L/∂W, then repeat with the next output gradient.',
    linearInputExplanation:
      '∂L/∂x[j] = Σᵢ W[i,j] × (∂L/∂y[i]). Add contributions from the outputs using the same column of W, then write the sum into one input-gradient component.',
    linearWeightHint:
      'Select a destination element to inspect its calculation. Use the slider to rewind or advance one element at a time.',
    linearWeightViewport:
      'Move one output gradient down the column of x, storing products in the weight gradient one at a time.',
    linearInputViewport:
      'Move the output-gradient column alongside each column of W and write the sum of products into the input gradient.',
    backwardNote:
      'Start with the given ∂L/∂y = [2, −1]. Use W and x saved from the forward pass to compute the weight and input gradients separately.',
    residualNote:
      'y = x + F, F = Wx. Addition passes the gradient to both paths; their two contributions are added at x.',
    attentionNote:
      '3 positions × 2 features, 1 head. Follow the Q / K / V projections, causal mask, softmax, and weighted sum. Bias and output projection are omitted.',
    attentionBackwardNote:
      '∂L/∂O is [1, −0.5] at the last position only. Compute weight gradients using this gradient and the values saved during the forward pass.',
    spatialReady:
      'Press Play to move the selected rows, columns, or elements into place.',
    spatialStep: 'Align the operands, compute, and store the result',
    spatialViewport:
      'Keep the source arrays visible, move copies beside the selected row or column, compute, and store each result.',
    splitStage: 'Backward through addition',
    splitStep: 'Pass the same output gradient to the skip and F paths',
    splitExplanation:
      'For y = x + F, the derivative with respect to either input is 1. Multiply each component of ∂L/∂y by 1 and pass it to both the skip gradient and ∂L/∂F. Then work backward through F = Wx and add the two gradients returning to x.',
    causalMask: 'causal mask',
    prototype: 'STANDALONE PROTOTYPE / BACKPROPAGATION',
    description:
      'Follow forward and backward computations by animating the numbers in small arrays.',
    sample: 'Computed teaching example',
    relation: 'Back to the article: Backpropagation',
    available: 'Already computed',
    given: 'Given',
    saved: 'Forward value',
    result: 'To compute',
    stage: 'Array to compute',
    play: 'Play',
    pause: 'Pause',
    next: 'Next step',
    previous: 'Previous step',
    reset: 'Restart',
    speed: 'Speed',
    progress: 'Computation progress',
    phases: [
      '① Select numbers',
      '② Multiply',
      '③ Add to the sum',
      '④ Write the result',
    ],
    pass: '② Move the number',
    exp: '② Compute exp',
    divide: '② Divide',
    hold: '④ Keep this sum',
    ready: 'Press Play to start with the first pair of numbers.',
    done: 'This array is complete.',
    sum: 'Running sum',
    product: 'This contribution',
    to: 'Destination',
    term: 'Term',
    hint: 'Click a destination element to start with its calculation. You can also use the arrow keys on the progress slider.',
    legend:
      'Orange / blue: current numbers · Green: destination · Dot: still to compute',
    viewport:
      'Animated numbers and calculations. Scroll horizontally on smaller screens.',
    masked:
      'Future positions are masked: their score is −∞ and their score gradient is 0.',
    explanation: {
      F: 'Align x beside each row of W, add corresponding products, and store the result in F.',
      dBranch:
        'Align ∂L/∂F beside each column of W and sum the products. This is the gradient returning to x through the transformed path.',
      y: 'y[i] = Σⱼ W[i,j] × x[j]. Add the products for one row and write the sum into one component of y.',
      dW: '∂y[i]/∂W[i,j] = x[j]. Multiply output gradient ∂L/∂y[i] by x[j] to obtain this weight’s gradient.',
      dx: '∂y[i]/∂x[j] = W[i,j]. Follow one column of W and sum its products with the output gradients to obtain ∂L/∂x[j].',
      residualDW:
        'Multiply ∂L/∂F[i] by x[j] and store it in ∂L/∂W[i,j]. Keep the same output gradient while visiting x from top to bottom.',
      residualY:
        'Add corresponding components of x and F and write them into y.',
      residualDx:
        'The same x was used in two paths. Add the gradients arriving along both paths, component by component.',
      dSkip:
        'Addition has derivative 1. Pass ∂L/∂y unchanged to the skip path.',
      dF: 'Addition has derivative 1. Pass the same ∂L/∂y to F as well.',
      dS: 'The softmax derivative is A[t,u] × (dA[t,u] − m[t]). Follow the products and additions, including subtraction of the row’s weighted mean m.',
      m: 'Sum products of A and ∂L/∂A within the row. This weighted mean is used in the softmax derivative.',
      E: 'Compute exp for each score. This small example evaluates exp(S) directly.',
      z: 'Add the exp values within one row to obtain the softmax denominator.',
      A: 'Divide each exp value by its row sum to obtain the attention weight.',
    },
    rounded:
      'Values are displayed to three decimal places; calculations use full precision. The browser computes this example from explicit teaching inputs and weights.',
    noScript: 'Enable JavaScript to operate the animation.',
  },
} as const;
